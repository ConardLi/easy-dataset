'use server';
import { db } from '@/lib/db/index';

/**
 * 获取项目的所有问题
 * @param {string} projectId - 项目ID
 * @param {number} page - 页码
 * @param {number} pageSize - 每页大小
 * @param answered
 * @param input
 * @returns {Promise<{data: Array, total: number}>} - 问题列表和总条数
 */
export async function getQuestions(projectId, page = 1, pageSize = 10, answered, input) {
  try {
    const whereClause = {
      projectId,
      ...(answered !== undefined && { answered: answered }), // 确保 answered 是布尔值
      OR: [{ question: { contains: input } }, { label: { contains: input } }]
    };

    const [data, total] = await Promise.all([
      db.questions.findMany({
        where: whereClause,
        orderBy: {
          createAt: 'desc'
        },
        include: {
          chunk: {
            select: {
              name: true,
              content: true
            }
          }
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.questions.count({
        where: whereClause
      })
    ]);

    // 批量查询 datasetCount
    const datasetCounts = await getDatasetCountsForQuestions(data.map(item => item.id));

    // 合并 datasetCount 到问题项中
    const questionsWithDatasetCount = data.map((item, index) => ({
      ...item,
      datasetCount: datasetCounts[index]
    }));

    return { data: questionsWithDatasetCount, total };
  } catch (error) {
    console.error('Failed to get questions by projectId in database');
    throw error;
  }
}

/**
 * 获取项目的所有问题（仅ID和标签），用于树形视图
 * @param {string} projectId - 项目ID
 * @param {string} input - 搜索关键词
 * @param {boolean} isDistill - 是否只查询蒸馏问题
 * @returns {Promise<Array>} - 问题列表（仅包含ID和标签）
 */
export async function getQuestionsForTree(projectId, input, isDistill = false) {
  try {
    console.log('[getQuestionsForTree] 参数:', { projectId, input, isDistill });

    // 如果是蒸馏问题，需要先获取蒸馏文本块
    let whereClause = {
      projectId,
      question: { contains: input || '' }
    };

    if (isDistill) {
      // 获取蒸馏文本块
      const distillChunk = await db.chunks.findFirst({
        where: {
          projectId,
          name: 'Distilled Content'
        }
      });

      if (distillChunk) {
        whereClause.chunkId = distillChunk.id;
      }
    }

    const data = await db.questions.findMany({
      where: whereClause,
      select: {
        id: true,
        label: true,
        answered: true
      },
      orderBy: {
        createAt: 'desc'
      }
    });

    return data;
  } catch (error) {
    console.error('获取树形视图问题失败:', error);
    throw error;
  }
}

/**
 * 根据标签获取项目的问题
 * @param {string} projectId - 项目ID
 * @param {string} tag - 标签名称
 * @param {string} input - 搜索关键词
 * @param {boolean} isDistill - 是否只查询蒸馏问题
 * @returns {Promise<Array>} - 问题列表
 */
export async function getQuestionsByTag(projectId, tag, input, isDistill = false) {
  try {
    const whereClause = {
      projectId
    };

    if (input) {
      whereClause.question = { contains: input };
    }

    if (tag === 'uncategorized') {
      whereClause.label = {
        in: [tag, '其他', 'Other', 'other']
      };
    } else {
      whereClause.label = { in: [tag] };
    }

    // 如果是蒸馏问题，需要先获取蒸馏文本块
    if (isDistill) {
      // 获取蒸馏文本块
      const distillChunk = await db.chunks.findFirst({
        where: {
          projectId,
          name: 'Distilled Content'
        }
      });

      if (distillChunk) {
        whereClause.chunkId = distillChunk.id;
      }
    }

    const data = await db.questions.findMany({
      where: whereClause,
      include: {
        chunk: {
          select: {
            name: true,
            content: true,
            answered: true
          }
        }
      },
      orderBy: {
        createAt: 'desc'
      }
    });

    // 批量查询 datasetCount
    const datasetCounts = await getDatasetCountsForQuestions(data.map(item => item.id));

    // 合并 datasetCount 到问题项中
    const questionsWithDatasetCount = data.map((item, index) => ({
      ...item,
      datasetCount: datasetCounts[index]
    }));

    return questionsWithDatasetCount;
  } catch (error) {
    console.error(`根据标签获取问题失败 (${tag}):`, error);
    throw error;
  }
}

export async function getAllQuestionsByProjectId(projectId) {
  try {
    return await db.questions.findMany({
      where: { projectId },
      include: {
        chunk: {
          select: {
            name: true,
            content: true
          }
        }
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

export async function getQuestionsIds(projectId, answered, input) {
  try {
    const whereClause = {
      projectId,
      ...(answered !== undefined && { answered: answered }), // 确保 answered 是布尔值
      OR: [{ question: { contains: input } }, { label: { contains: input } }]
    };
    return await db.questions.findMany({
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

export async function getQuestionsByTagName(projectId, tagName) {
  try {
    return await db.questions.findMany({
      where: {
        projectId,
        label: tagName
      },
      include: {
        chunk: {
          select: {
            name: true
          }
        }
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
 * 批量获取问题的 datasetCount
 * @param {Array<string>} questionIds - 问题ID列表
 * @returns {Promise<Array<number>>} - 每个问题的 datasetCount 列表
 */
async function getDatasetCountsForQuestions(questionIds) {
  const datasetCounts = await db.datasets.groupBy({
    by: ['questionId'],
    _count: {
      questionId: true
    },
    where: {
      questionId: {
        in: questionIds
      }
    }
  });

  // 将结果转换为 questionId 到 datasetCount 的映射
  const datasetCountMap = datasetCounts.reduce((map, item) => {
    map[item.questionId] = item._count.questionId;
    return map;
  }, {});

  // 返回与 questionIds 顺序对应的 datasetCount 列表
  return questionIds.map(id => datasetCountMap[id] || 0);
}

export async function getQuestionById(id) {
  try {
    return await db.questions.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error('Failed to get questions by name in database');
    throw error;
  }
}

export async function isExistByQuestion(question) {
  try {
    const count = await db.questions.count({
      where: { question }
    });
    return count > 0;
  } catch (error) {
    console.error('Failed to get questions by name in database');
    throw error;
  }
}

export async function getQuestionsCount(projectId) {
  try {
    return await db.questions.count({
      where: {
        projectId
      }
    });
  } catch (error) {
    console.error('Failed to get questions count in database');
    throw error;
  }
}

/**
 * 保存项目的问题列表
 * @param {string} projectId - 项目ID
 * @param {Array} questions - 问题列表
 * @param chunkId
 * @returns {Promise<Array>} - 保存后的问题列表
 */
export async function saveQuestions(projectId, questions, chunkId) {
  try {
    let data = questions.map(item => {
      return {
        projectId,
        chunkId: chunkId ? chunkId : item.chunkId,
        question: item.question,
        label: item.label
      };
    });
    return await db.questions.createMany({ data: data });
  } catch (error) {
    console.error('Failed to create questions in database');
    throw error;
  }
}

export async function updateQuestion(question) {
  try {
    return await db.questions.update({ where: { id: question.id }, data: question });
  } catch (error) {
    console.error('Failed to update questions in database');
    throw error;
  }
}

/**
 * 获取指定文本块的问题
 * @param {string} projectId - 项目ID
 * @param {string} chunkId - 文本块ID
 * @returns {Promise<Array>} - 问题列表
 */
export async function getQuestionsForChunk(projectId, chunkId) {
  return await db.questions.findMany({ where: { projectId, chunkId } });
}

/**
 * 删除单个问题
 * @param {string} questionId - 问题ID
 */
export async function deleteQuestion(questionId) {
  try {
    console.log(questionId);
    return await db.questions.delete({
      where: {
        id: questionId
      }
    });
  } catch (error) {
    console.error('Failed to delete questions by id in database');
    throw error;
  }
}

/**
 * 批量删除问题
 * @param {Array} questionIds
 */
export async function batchDeleteQuestions(questionIds) {
  try {
    return await db.questions.deleteMany({
      where: {
        id: {
          in: questionIds
        }
      }
    });
  } catch (error) {
    console.error('Failed to delete batch questions in database');
    throw error;
  }
}
