'use server';

import fs from 'fs';
import path from 'path';
import {getProjectRoot, ensureDir, readJsonFile, writeJsonFile} from './base';
import {getDatasets} from "@/lib/db/datasets";

/**
 * 获取项目的所有问题
 * @param {string} projectId - 项目ID
 * @returns {Promise<Array>} - 问题列表
 */
export async function getQuestions(projectId) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const questionsPath = path.join(projectPath, 'questions.json');
  const questions = await readJsonFile(questionsPath);
  return questions;
}

/**
 * 使用分页获取项目的问题
 * @param {string} projectId - 项目ID
 * @param {number} page - 当前页
 * @param {number} limit - 项目数量
 * @param {string} filter - 是否回答
 * @param {string} q - 检索问题
 * @returns {Promise<{
 *    data: [],        // 当前页数据切片
 *   limit: number,   // 实际使用的分页大小
 *   totalPages: number, // 总页数（0 表示无数据）
 *   total: number, // 总数（0 表示无数据）
 *   hasNextPage: boolean,
 *   nextPage: number|null,
 *   hasPrevPage: boolean,
 *   prevPage: number|null
 * }>} - 问题列表
 */
export async function getQuestionsWithPaginate(projectId, page, limit, filter = 'all', q = '') {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const questionsPath = path.join(projectPath, 'questions.json');

  const jsonArray = await readJsonFile(questionsPath);

  // 获取数据集
  const datasets = await getDatasets(projectId);

  // 将嵌套的问题数据结构拍平
  const flattenedQuestions = [];

  jsonArray.forEach(item => {
    const { chunkId, questions } = item;

    if (questions && Array.isArray(questions)) {
      questions.forEach(question => {
        const dataSites = datasets.filter(dataset => dataset.question === question.question);
        question.dataSites = dataSites;
        // 搜索词筛选
        const matchesSearch =
            q === '' ||
            question.question.toLowerCase().includes(q.toLowerCase()) ||
            (question.label && question.label.toLowerCase().includes(q.toLowerCase()));

        // 答案状态筛选
        let matchesAnswerFilter = true;
        if (filter === 'answered') {
          matchesAnswerFilter = question.dataSites && question.dataSites.length > 0;
        } else if (filter === 'unanswered') {
          matchesAnswerFilter = !question.dataSites || question.dataSites.length === 0;
        }

        if (matchesAnswerFilter && matchesSearch) {
          flattenedQuestions.push({
            ...question,
            chunkId
          });
        }

      });
    }
  });

  // 处理参数类型和默认值
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  // 计算分页元数据
  const totalItems = flattenedQuestions.length;
  const totalPages = Math.ceil(totalItems / limit) || 0;

  // 修正 page 的合法范围
  if (totalPages > 0) {
    page = Math.min(page, totalPages);
    page = Math.max(page, 1);
  } else {
    page = 1; // 无数据时重置为第一页
  }
  // 获取当前页数据
  const startIdx = (page - 1) * limit;
  const endIdx = page * limit;
  const paginatedData = flattenedQuestions.slice(startIdx, endIdx);
  // 计算分页状态
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1 && totalPages > 0;

  return {
    data: paginatedData,
    limit,
    total: totalItems,
    totalPages,
    hasNextPage,
    nextPage: hasNextPage ? page + 1 : null,
    hasPrevPage,
    prevPage: hasPrevPage ? page - 1 : null
  };


  // return await readJsonFileWithPaginate(questionsPath, page, limit, filter, q);
}


/**
 * 保存项目的问题列表
 * @param {string} projectId - 项目ID
 * @param {Array} questions - 问题列表
 * @returns {Promise<Array>} - 保存后的问题列表
 */
export async function saveQuestions(projectId, questions) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const questionsPath = path.join(projectPath, 'questions.json');

  await ensureDir(projectPath);

  try {
    await writeJsonFile(questionsPath, questions);
    return questions;
  } catch (error) {
    console.error('保存问题列表失败:', error);
    throw error;
  }
}

/**
 * 添加问题到项目
 * @param {string} projectId - 项目ID
 * @param {string} chunkId - 文本块ID
 * @param {Array} newQuestions - 新问题列表
 * @returns {Promise<Array>} - 更新后的问题列表
 */
export async function addQuestionsForChunk(projectId, chunkId, newQuestions) {
  const questions = await getQuestions(projectId);

  // 检查是否已存在该文本块的问题
  const existingIndex = questions.findIndex(item => item.chunkId === chunkId);

  if (existingIndex >= 0) {
    // 更新现有问题
    questions[existingIndex].questions = newQuestions;
  } else {
    // 添加新问题
    questions.push({
      chunkId,
      questions: newQuestions
    });
  }

  return await saveQuestions(projectId, questions);
}

/**
 * 获取指定文本块的问题
 * @param {string} projectId - 项目ID
 * @param {string} chunkId - 文本块ID
 * @returns {Promise<Array>} - 问题列表
 */
export async function getQuestionsForChunk(projectId, chunkId) {
  const questions = await getQuestions(projectId);
  const chunkQuestions = questions.find(item => item.chunkId === chunkId);

  return chunkQuestions ? chunkQuestions.questions : [];
}

/**
 * 删除指定文本块的问题
 * @param {string} projectId - 项目ID
 * @param {string} chunkId - 文本块ID
 * @returns {Promise<Array>} - 更新后的问题列表
 */
export async function deleteQuestionsForChunk(projectId, chunkId) {
  const questions = await getQuestions(projectId);
  const updatedQuestions = questions.filter(item => item.chunkId !== chunkId);

  return await saveQuestions(projectId, updatedQuestions);
}

/**
 * 删除单个问题
 * @param {string} projectId - 项目ID
 * @param {string} questionId - 问题ID
 * @param {string} chunkId - 文本块ID
 * @returns {Promise<Array>} - 更新后的问题列表
 */
export async function deleteQuestion(projectId, questionId, chunkId) {
  const questions = await getQuestions(projectId);

  // 找到包含该问题的文本块
  const chunkIndex = questions.findIndex(item => item.chunkId === chunkId);

  if (chunkIndex === -1) {
    // 如果没有找到文本块，返回原有问题列表
    return questions;
  }

  // 复制问题列表，避免直接修改原有对象
  const updatedQuestions = [...questions];
  const chunk = { ...updatedQuestions[chunkIndex] };

  // 从文本块中移除指定问题
  chunk.questions = chunk.questions.filter(q => q.question !== questionId);

  // 更新文本块
  updatedQuestions[chunkIndex] = chunk;

  // 如果文本块中没有问题了，可以选择移除该文本块
  // 这里选择保留空文本块，以便后续可能添加新问题

  return await saveQuestions(projectId, updatedQuestions);
}

/**
 * 批量删除问题
 * @param {string} projectId - 项目ID
 * @param {Array} questionsToDelete - 要删除的问题数组，每个元素包含 questionId 和 chunkId
 * @returns {Promise<Array>} - 更新后的问题列表
 */
export async function batchDeleteQuestions(projectId, questionsToDelete) {
  let questions = await getQuestions(projectId);

  // 对每个要删除的问题，从其所属的文本块中移除
  for (const { questionId, chunkId } of questionsToDelete) {
    // 找到包含该问题的文本块
    const chunkIndex = questions.findIndex(item => item.chunkId === chunkId);

    if (chunkIndex !== -1) {
      // 复制文本块对象
      const chunk = { ...questions[chunkIndex] };

      // 从文本块中移除指定问题
      chunk.questions = chunk.questions.filter(q => q.question !== questionId);

      // 更新文本块
      questions[chunkIndex] = chunk;
    }
  }

  // 保存更新后的问题列表
  return await saveQuestions(projectId, questions);
}
