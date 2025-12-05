'use server';

import path from 'path';
import { getProjectRoot, readJsonFile, writeJsonFile } from './base';
import { db } from '@/lib/db/index';
import fs from 'fs';

// 获取标签树
export async function getTags(projectId) {
  try {
    return await getTagsTreeWithQuestionCount(projectId);
  } catch (error) {
    return [];
  }
}

// 优化后的递归查询树状结构，并统计问题数量
async function getTagsTreeWithQuestionCount(projectId, parentId = null) {
  // 一次性获取所有相关标签
  const allTags = await db.tags.findMany({
    where: { projectId },
    orderBy: { label: 'asc' }
  });

  // 创建标签映射以便快速查找
  const tagMap = new Map();
  const tagTree = [];

  // 初始化标签映射
  allTags.forEach(tag => {
    tagMap.set(tag.id, {
      ...tag,
      questionCount: 0,
      child: []
    });
  });

  // 构建树结构
  allTags.forEach(tag => {
    if (tag.parentId === parentId) {
      tagTree.push(tagMap.get(tag.id));
    } else if (tag.parentId && tagMap.has(tag.parentId)) {
      tagMap.get(tag.parentId).child.push(tagMap.get(tag.id));
    }
  });

  // 获取该项目的所有问题并按标签分组统计
  const questionCounts = await db.questions.groupBy({
    by: ['label'],
    where: { projectId },
    _count: {
      id: true
    }
  });

  // 创建标签到问题数量的映射
  const questionCountMap = new Map();
  questionCounts.forEach(item => {
    questionCountMap.set(item.label, item._count.id);
  });

  // 为每个标签设置直接问题数量
  allTags.forEach(tag => {
    const count = questionCountMap.get(tag.label) || 0;
    tagMap.get(tag.id).questionCount = count;
  });

  // 数字感知的标签比较函数
  function compareLabels(tag1, tag2) {
    const label1 = tag1.label;
    const label2 = tag2.label;
    
    if (!label1 && !label2) return 0;
    if (!label1) return -1;
    if (!label2) return 1;
    
    // 使用正则表达式匹配以数字或小数开头的部分
    const numberPattern = /^(\d+(\.\d+)?)\s*(.*)/;
    
    const match1 = label1.match(numberPattern);
    const match2 = label2.match(numberPattern);
    
    // 如果两个label都以数字或小数开头
    if (match1 && match2) {
      // 提取数字部分并转换为float进行比较
      const num1 = parseFloat(match1[1]);
      const num2 = parseFloat(match2[1]);
      
      // 如果数字部分不相等，按数字排序
      if (num1 !== num2) {
        return num1 - num2;
      }
      
      // 如果数字部分相等，按剩余部分排序
      const rest1 = match1[3] || '';
      const rest2 = match2[3] || '';
      return rest1.localeCompare(rest2);
    }
    
    // 如果不都以数字开头，按字符串排序
    return label1.localeCompare(label2);
  }

  // 对标签树进行递归排序
  function sortTagTree(tag) {
    // 对当前节点的子节点进行排序
    tag.child.sort(compareLabels);
    
    // 递归对所有子节点进行排序
    tag.child.forEach(child => sortTagTree(child));
  }

  // 对所有根节点进行排序
  tagTree.sort(compareLabels);

  // 递归排序每个根节点下的子树
  tagTree.forEach(root => sortTagTree(root));

  return tagTree;
}

// 已废弃的方法，保留以确保向后兼容性
async function getAllLabels(tagId) {
  const labels = [];
  const queue = [tagId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const tag = await db.tags.findUnique({
      where: { id: currentId }
    });

    if (tag) {
      labels.push(tag.label);
      // 获取子分类的 ID，加入队列
      const children = await db.tags.findMany({
        where: { parentId: currentId },
        select: { id: true }
      });
      queue.push(...children.map(child => child.id));
    }
  }

  return labels;
}

export async function createTag(projectId, label, parentId) {
  try {
    let data = {
      projectId,
      label
    };
    if (parentId) {
      data.parentId = parentId;
    }
    return await db.tags.create({ data });
  } catch (error) {
    console.error('Error insert tags db:', error);
    throw error;
  }
}

export async function updateTag(label, id) {
  try {
    return await db.tags.update({ where: { id }, data: { label } });
  } catch (error) {
    console.error('Error update tags db:', error);
    throw error;
  }
}

/**
 * 删除标签及其所有子标签、问题和数据集
 * @param {string} id - 要删除的标签 ID
 * @returns {Promise<object>} 删除结果
 */
export async function deleteTag(id) {
  try {
    console.log(`开始删除标签: ${id}`);

    // 1. 获取要删除的标签
    const tag = await db.tags.findUnique({
      where: { id }
    });

    if (!tag) {
      throw new Error(`标签不存在: ${id}`);
    }

    // 2. 获取所有子标签（所有层级）
    const allChildTags = await getAllChildTags(id, tag.projectId);
    console.log(`找到 ${allChildTags.length} 个子标签需要删除`);

    // 3. 从叶子节点开始删除，防止外键约束问题
    for (const childTag of allChildTags.reverse()) {
      // 删除与标签相关的数据集
      await deleteDatasetsByTag(childTag.label, childTag.projectId);

      // 删除与标签相关的问题
      await deleteQuestionsByTag(childTag.label, childTag.projectId);

      // 删除标签
      await db.tags.delete({ where: { id: childTag.id } });
      console.log(`删除子标签: ${childTag.id} (${childTag.label})`);
    }

    // 4. 删除与当前标签相关的数据集
    await deleteDatasetsByTag(tag.label, tag.projectId);

    // 5. 删除与当前标签相关的问题
    await deleteQuestionsByTag(tag.label, tag.projectId);

    // 6. 删除当前标签
    console.log(`删除主标签: ${id} (${tag.label})`);
    return await db.tags.delete({ where: { id } });
  } catch (error) {
    console.error('删除标签时出错:', error);
    throw error;
  }
}

/**
 * 获取标签的所有子标签（所有层级）
 * @param {string} parentId - 父标签 ID
 * @param {string} projectId - 项目 ID
 * @returns {Promise<Array>} 所有子标签列表
 */
async function getAllChildTags(parentId, projectId) {
  const result = [];

  // 递归获取子标签
  async function fetchChildTags(pid) {
    // 查询直接子标签
    const children = await db.tags.findMany({
      where: {
        parentId: pid,
        projectId
      }
    });

    // 如果有子标签
    if (children.length > 0) {
      // 将子标签添加到结果中
      result.push(...children);

      // 递归获取每个子标签的子标签
      for (const child of children) {
        await fetchChildTags(child.id);
      }
    }
  }

  // 开始递归获取
  await fetchChildTags(parentId);

  return result;
}

/**
 * 删除与标签相关的问题
 * @param {string} label - 标签名称
 * @param {string} projectId - 项目 ID
 */
async function deleteQuestionsByTag(label, projectId) {
  try {
    // 查找并删除与标签相关的所有问题
    await db.questions.deleteMany({
      where: {
        label,
        projectId
      }
    });
  } catch (error) {
    console.error(`删除标签 "${label}" 相关问题时出错:`, error);
    throw error;
  }
}

/**
 * 删除与标签相关的数据集
 * @param {string} label - 标签名称
 * @param {string} projectId - 项目 ID
 */
async function deleteDatasetsByTag(label, projectId) {
  try {
    // 查找并删除与标签相关的所有数据集
    await db.datasets.deleteMany({
      where: {
        questionLabel: label,
        projectId
      }
    });
  } catch (error) {
    console.error(`删除标签 "${label}" 相关数据集时出错:`, error);
    throw error;
  }
}

// 保存整个标签树
export async function batchSaveTags(projectId, tags) {
  try {
    // 仅在入口函数删除所有标签，避免递归中重复删除
    await db.tags.deleteMany({ where: { projectId } });
    // 处理标签树
    await insertTags(projectId, tags);
  } catch (error) {
    console.error('Error insert tags db:', error);
    throw error;
  }
}

async function insertTags(projectId, tags, parentId = null) {
  // 删除操作已移至外层函数，这里不再需要
  for (const tag of tags) {
    // 插入当前节点
    const createdTag = await db.tags.create({
      data: {
        projectId,
        label: tag.label,
        parentId: parentId
      }
    });
    // 如果有子节点，递归插入
    if (tag.child && tag.child.length > 0) {
      await insertTags(projectId, tag.child, createdTag.id);
    }
  }
}