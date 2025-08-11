'use server';
import { db } from '@/lib/db/index';

/**
 * 获取数据集列表(根据项目ID)
 * @param projectId 项目id
 * @param page
 * @param pageSize
 * @param confirmed
 * @param input
 * @param field 搜索字段，可选值：question, answer, cot, questionLabel
 * @param hasCot 思维链筛选，可选值：all, yes, no
 * @param isDistill 蒸馏数据集筛选，可选值：all, yes, no
 */
export async function getDatasetsByPagination(
  projectId,
  page = 1,
  pageSize = 10,
  confirmed,
  input,
  field = 'question',
  hasCot = 'all',
  isDistill = 'all'
) {
  try {
    // 根据搜索字段构建查询条件
    const searchCondition = {};
    if (input) {
      if (field === 'question') {
        searchCondition.question = { contains: input };
      } else if (field === 'answer') {
        searchCondition.answer = { contains: input };
      } else if (field === 'cot') {
        searchCondition.cot = { contains: input };
      } else if (field === 'questionLabel') {
        searchCondition.questionLabel = { contains: input };
      }
    }

    // 思维链筛选条件
    const cotCondition = {};
    if (hasCot === 'yes') {
      cotCondition.cot = { not: '' };
    } else if (hasCot === 'no') {
      cotCondition.cot = '';
    }

    // 蒸馏数据集筛选条件
    const distillCondition = {};
    if (isDistill === 'yes') {
      distillCondition.chunkName = 'Distilled Content';
    } else if (isDistill === 'no') {
      distillCondition.chunkName = { not: 'Distilled Content' };
    }

    const whereClause = {
      projectId,
      ...(confirmed !== undefined && { confirmed: confirmed }),
      ...searchCondition,
      ...cotCondition,
      ...distillCondition
    };

    console.log(111, whereClause);

    const [data, total, confirmedCount] = await Promise.all([
      db.datasets.findMany({
        where: whereClause,
        orderBy: {
          createAt: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.datasets.count({
        where: whereClause
      }),
      db.datasets.count({
        where: { ...whereClause, confirmed: true }
      })
    ]);

    return { data, total, confirmedCount };
  } catch (error) {
    console.error('Failed to get datasets by pagination in database');
    throw error;
  }
}

export async function getDatasets(projectId, confirmed) {
  try {
    const whereClause = {
      projectId,
      ...(confirmed !== undefined && { confirmed: confirmed })
    };
    return await db.datasets.findMany({
      where: whereClause,
      select: {
        question: true,
        answer: true,
        cot: true,
        questionLabel: true
      },
      orderBy: {
        createAt: 'desc'
      }
    });
  } catch (error) {
    console.error('Failed to get datasets in database');
    throw error;
  }
}

export async function getDatasetsIds(
  projectId,
  confirmed,
  input,
  field = 'question',
  hasCot = 'all',
  isDistill = 'all'
) {
  try {
    // 根据搜索字段构建查询条件
    const searchCondition = {};
    if (input) {
      if (field === 'question') {
        searchCondition.question = { contains: input };
      } else if (field === 'answer') {
        searchCondition.answer = { contains: input };
      } else if (field === 'cot') {
        searchCondition.cot = { contains: input };
      } else if (field === 'questionLabel') {
        searchCondition.questionLabel = { contains: input };
      }
    }

    // 思维链筛选条件
    const cotCondition = {};
    if (hasCot === 'yes') {
      cotCondition.cot = { not: null };
      cotCondition.cot = { not: '' };
    } else if (hasCot === 'no') {
      cotCondition.OR = [{ cot: null }, { cot: '' }];
    }

    // 蒸馏数据集筛选条件
    const distillCondition = {};
    if (isDistill === 'yes') {
      distillCondition.chunkName = 'Distilled Content';
    } else if (isDistill === 'no') {
      distillCondition.chunkName = { not: 'Distilled Content' };
    }

    const whereClause = {
      projectId,
      ...(confirmed !== undefined && { confirmed: confirmed }),
      ...searchCondition,
      ...cotCondition,
      ...distillCondition
    };
    return await db.datasets.findMany({
      where: whereClause,
      select: {
        id: true
      },
      orderBy: {
        createAt: 'desc'
      }
    });
  } catch (error) {
    console.error('Failed to get datasets ids in database');
    throw error;
  }
}

/**
 * 获取数据集数量(根据项目ID)
 * @param projectId 项目id
 */
export async function getDatasetsCount(projectId) {
  try {
    return await db.datasets.count({
      where: {
        projectId
      }
    });
  } catch (error) {
    console.error('Failed to get datasets count by projectId in database');
    throw error;
  }
}

/**
 * 获取数据集数量(根据问题Id)
 * @param questionId 问题Id
 */
export async function getDatasetsCountByQuestionId(questionId) {
  try {
    return await db.datasets.count({
      where: {
        questionId
      }
    });
  } catch (error) {
    console.error('Failed to get datasets count by projectId in database');
    throw error;
  }
}

/**
 * 获取数据集详情
 * @param id 数据集id
 */
export async function getDatasetsById(id) {
  try {
    return await db.datasets.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error('Failed to get datasets by id in database');
    throw error;
  }
}

/**
 * 保存数据集列表
 * @param dataset
 */
export async function createDataset(dataset) {
  try {
    return await db.datasets.create({
      data: dataset
    });
  } catch (error) {
    console.error('Failed to save datasets in database');
    throw error;
  }
}

export async function updateDataset(dataset) {
  try {
    return await db.datasets.update({
      data: dataset,
      where: {
        id: dataset.id
      }
    });
  } catch (error) {
    console.error('Failed to update datasets in database');
    throw error;
  }
}

export async function deleteDataset(datasetId) {
  try {
    return await db.datasets.delete({
      where: {
        id: datasetId
      }
    });
  } catch (error) {
    console.error('Failed to delete datasets in database');
    throw error;
  }
}

export async function getDatasetsCounts(projectId) {
  try {
    const [total, confirmedCount] = await Promise.all([
      db.datasets.count({
        where: { projectId }
      }),
      db.datasets.count({
        where: { projectId, confirmed: true }
      })
    ]);

    return { total, confirmedCount };
  } catch (error) {
    console.error('Failed to delete datasets in database');
    throw error;
  }
}

export async function getNavigationItems(projectId, datasetId, operateType) {
  const currentItem = await db.datasets.findUnique({
    where: { id: datasetId }
  });
  if (!currentItem) {
    throw new Error('Current record does not exist');
  }
  if (operateType === 'prev') {
    return await db.datasets.findFirst({
      where: { createAt: { gt: currentItem.createAt }, projectId },
      orderBy: { createAt: 'asc' }
    });
  } else {
    return await db.datasets.findFirst({
      where: { createAt: { lt: currentItem.createAt }, projectId },
      orderBy: { createAt: 'desc' }
    });
  }
}

/**
 * 获取按标签平衡的数据集
 * @param {string} projectId 项目ID
 * @param {Array} balanceConfig 平衡配置 [{tagLabel, maxCount}]
 * @param {boolean} confirmed 是否只获取确认的数据
 * @returns {Promise<Array>} 平衡后的数据集列表
 */
export async function getBalancedDatasetsByTags(projectId, balanceConfig, confirmed) {
  try {
    const results = [];

    for (const config of balanceConfig) {
      const { tagLabel, maxCount } = config;

      // 获取该标签下的数据集
      const tagDatasets = await db.datasets.findMany({
        where: {
          projectId,
          questionLabel: tagLabel,
          ...(confirmed !== undefined && { confirmed: confirmed })
        },
        select: {
          question: true,
          answer: true,
          cot: true,
          questionLabel: true
        },
        orderBy: {
          createAt: 'desc'
        },
        take: maxCount // 限制数量
      });

      results.push(...tagDatasets);
    }

    return results;
  } catch (error) {
    console.error('Failed to get balanced datasets by tags in database');
    throw error;
  }
}

/**
 * 获取标签的统计信息（包含数据集数量）
 * @param {string} projectId 项目ID
 * @param {boolean} confirmed 是否只统计确认的数据
 * @returns {Promise<Array>} 标签统计信息
 */
export async function getTagsWithDatasetCounts(projectId, confirmed) {
  try {
    // 获取所有标签的数据集统计
    const tagCounts = await db.datasets.groupBy({
      by: ['questionLabel'],
      where: {
        projectId,
        ...(confirmed !== undefined && { confirmed: confirmed })
      },
      _count: {
        id: true
      }
    });

    // 转换为更友好的格式
    return tagCounts.map(item => ({
      tagLabel: item.questionLabel,
      datasetCount: item._count.id
    }));
  } catch (error) {
    console.error('Failed to get tags with dataset counts in database');
    throw error;
  }
}
