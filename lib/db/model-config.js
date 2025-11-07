'use server';
import { db } from '@/lib/db/index';
import { nanoid } from 'nanoid';

export async function getModelConfigByProjectId(projectId) {
  try {
    return await db.modelConfig.findMany({ where: { projectId } });
  } catch (error) {
    console.error('Failed to get modelConfig by projectId in database');
    throw error;
  }
}

export async function createInitModelConfig(data) {
  try {
    // MySQL 不支持 createManyAndReturn，先创建再查询
    await db.modelConfig.createMany({ data });
    // 根据 projectId 和 id 列表查询返回创建的数据
    if (data.length > 0 && data[0].projectId) {
      const projectId = data[0].projectId;
      const ids = data.map(item => item.id).filter(Boolean);
      if (ids.length > 0) {
        return await db.modelConfig.findMany({
          where: {
            projectId,
            id: { in: ids }
          }
        });
      }
      // 如果没有 id，根据 projectId 查询所有
      return await db.modelConfig.findMany({
        where: { projectId },
        orderBy: { createAt: 'desc' },
        take: data.length
      });
    }
    return [];
  } catch (error) {
    console.error('Failed to create init modelConfig list in database');
    throw error;
  }
}

export async function getModelConfigById(id) {
  try {
    return await db.modelConfig.findUnique({ where: { id } });
  } catch (error) {
    console.error('Failed to get modelConfig by id in database');
    throw error;
  }
}

export async function deleteModelConfigById(id) {
  try {
    return await db.modelConfig.delete({ where: { id } });
  } catch (error) {
    console.error('Failed to delete modelConfig by id in database');
    throw error;
  }
}

export async function saveModelConfig(models) {
  try {
    if (!models.id) {
      models.id = nanoid(12);
    }
    return await db.modelConfig.upsert({ create: models, update: models, where: { id: models.id } });
  } catch (error) {
    console.error('Failed to create modelConfig in database');
    throw error;
  }
}
