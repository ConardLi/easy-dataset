'use server';
import { db } from '@/lib/db/index';

/**
 * 获取数据集列表(根据项目ID)
 * @param projectId 项目id
 */
export async function getDatasets(projectId) {
  try {
    return await db.datasets.findMany({
      where: { projectId },
      include: {
        chunk: {
          select: {
            name: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to get datasets by projectId in database');
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
 * 获取数据集详情
 * @param id 数据集id
 * @param isIncludeChunk
 */
export async function getDatasetsById(id, isIncludeChunk = true) {
  try {
    return await db.datasets.findUnique({
      where: { id },
      include: isIncludeChunk
        ? {
            chunk: {
              select: {
                name: true
              }
            }
          }
        : undefined
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
