'use server';
import { db } from '@/lib/db/index';

/**
 * 获取文件的所有 GA 对
 * @param {string} fileId - 文件 ID
 * @returns {Promise<Array>} GA 对列表
 */
export async function getGaPairsByFileId(fileId) {
  try {
    return await db.gaPairs.findMany({
      where: { fileId },
      orderBy: { pairNumber: 'asc' }
    });
  } catch (error) {
    console.error('Failed to get GA pairs by fileId in database:', error);
    throw error;
  }
}

/**
 * 获取项目的所有 GA 对
 * @param {string} projectId - 项目 ID
 * @returns {Promise<Array>} GA 对列表
 */
export async function getGaPairsByProjectId(projectId) {
  try {
    return await db.gaPairs.findMany({
      where: { projectId },
      include: {
        uploadFile: {
          select: {
            fileName: true
          }
        }
      },
      orderBy: [{ fileId: 'asc' }, { pairNumber: 'asc' }]
    });
  } catch (error) {
    console.error('Failed to get GA pairs by projectId in database:', error);
    throw error;
  }
}

/**
 * 创建 GA 对
 * @param {Array} gaPairs - GA 对数据数组
 * @returns {Promise<Array>} 创建的 GA 对
 */
export async function createGaPairs(gaPairs) {
  try {
    // MySQL 不支持 createManyAndReturn，先创建再查询
    await db.gaPairs.createMany({ data: gaPairs });
    // 根据 projectId, fileId 和 pairNumber 查询返回创建的数据
    if (gaPairs.length > 0 && gaPairs[0].projectId && gaPairs[0].fileId) {
      const projectId = gaPairs[0].projectId;
      const fileId = gaPairs[0].fileId;
      const pairNumbers = gaPairs.map(pair => pair.pairNumber).filter(Boolean);
      if (pairNumbers.length > 0) {
        return await db.gaPairs.findMany({
          where: {
            projectId,
            fileId,
            pairNumber: { in: pairNumbers }
          },
          orderBy: { pairNumber: 'asc' }
        });
      }
      // 如果没有 pairNumber，根据 projectId 和 fileId 查询所有
      return await db.gaPairs.findMany({
        where: { projectId, fileId },
        orderBy: { pairNumber: 'asc' },
        take: gaPairs.length
      });
    }
    return [];
  } catch (error) {
    console.error('Failed to create GA pairs in database:', error);
    throw error;
  }
}

/**
 * 更新单个 GA 对
 * @param {string} id - GA 对 ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新后的 GA 对
 */
export async function updateGaPair(id, data) {
  try {
    return await db.gaPairs.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error('Failed to update GA pair in database:', error);
    throw error;
  }
}

/**
 * 删除文件的所有 GA 对
 * @param {string} fileId - 文件 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteGaPairsByFileId(fileId) {
  try {
    return await db.gaPairs.deleteMany({
      where: { fileId }
    });
  } catch (error) {
    console.error('Failed to delete GA pairs by fileId in database:', error);
    throw error;
  }
}

/**
 * 切换 GA 对的激活状态
 * @param {string} id - GA 对 ID
 * @param {boolean} isActive - 激活状态
 * @returns {Promise<Object>} 更新后的 GA 对
 */
export async function toggleGaPairActive(id, isActive) {
  try {
    return await db.gaPairs.update({
      where: { id },
      data: { isActive }
    });
  } catch (error) {
    console.error('Failed to toggle GA pair active status in database:', error);
    throw error;
  }
}

/**
 * 获取文件的激活 GA 对
 * @param {string} fileId - 文件 ID
 * @returns {Promise<Array>} 激活的 GA 对列表
 */
export async function getActiveGaPairsByFileId(fileId) {
  try {
    return await db.gaPairs.findMany({
      where: {
        fileId,
        isActive: true
      },
      orderBy: { pairNumber: 'asc' }
    });
  } catch (error) {
    console.error('Failed to get active GA pairs by fileId in database:', error);
    throw error;
  }
}

/**
 * 批量更新 GA 对
 * @param {Array} updates - 更新数据数组，每个包含 id 和其他字段
 * @returns {Promise<Array>} 更新结果
 */
export async function batchUpdateGaPairs(updates) {
  try {
    const results = await Promise.all(
      updates.map(({ id, ...updateData }) => {
        // 过滤掉不应该更新的字段
        const { createAt, updateAt, projectId, fileId, pairNumber, ...data } = updateData;

        // 确保有数据需要更新
        if (Object.keys(data).length === 0) {
          console.warn(`No data to update for GA pair ${id}`);
          return Promise.resolve(null);
        }

        return db.gaPairs.update({
          where: { id },
          data
        });
      })
    );

    // 过滤掉null结果
    return results.filter(result => result !== null);
  } catch (error) {
    console.error('Failed to batch update GA pairs in database:', error);
    throw error;
  }
}

/**
 * Generate and save GA pairs for a specific file using LLM
 * @param {string} projectId - Project ID
 * @param {string} fileId - File ID
 * @param {Array} gaPairs - Array of GA pair objects from LLM
 * @returns {Promise<Array>} - Created GA pairs
 */
export async function saveGaPairs(projectId, fileId, gaPairs) {
  try {
    // First, delete existing GA pairs for this file to avoid conflicts
    await db.gaPairs.deleteMany({
      where: { projectId, fileId }
    });

    // Map the GA pairs to database format
    const gaPairData = gaPairs.map((pair, index) => ({
      projectId,
      fileId,
      pairNumber: index + 1, // 1-5
      genreTitle: pair.genre.title,
      genreDesc: pair.genre.description,
      audienceTitle: pair.audience.title,
      audienceDesc: pair.audience.description,
      isActive: true
    }));

    return await db.gaPairs.createMany({ data: gaPairData });
  } catch (error) {
    console.error('Failed to save GA pairs in database:', error);
    throw error;
  }
}

/**
 * Check if GA pairs exist for a file
 * @param {string} projectId - Project ID
 * @param {string} fileId - File ID
 * @returns {Promise<boolean>} - Whether GA pairs exist
 */
export async function hasGaPairs(projectId, fileId) {
  try {
    const count = await db.gaPairs.count({
      where: { projectId, fileId }
    });
    return count > 0;
  } catch (error) {
    console.error('Failed to check GA pairs existence:', error);
    throw error;
  }
}

/**
 * Get GA pair statistics for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} - GA pair statistics
 */
export async function getGaPairStats(projectId) {
  try {
    const totalCount = await db.gaPairs.count({
      where: { projectId }
    });

    const activeCount = await db.gaPairs.count({
      where: { projectId, isActive: true }
    });

    const filesWithGaPairs = await db.gaPairs.groupBy({
      by: ['fileId'],
      where: { projectId }
    });

    return {
      totalPairs: totalCount,
      activePairs: activeCount,
      filesWithPairs: filesWithGaPairs.length
    };
  } catch (error) {
    console.error('Failed to get GA pair statistics:', error);
    throw error;
  }
}
