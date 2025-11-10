'use server';
import { db } from '@/lib/db/index';
import { nanoid } from 'nanoid';
import { saveModelApiKey, getModelApiKey, deleteEnvVariable, getModelApiKeyEnvName } from '@/lib/util/env-manager';

export async function getModelConfigByProjectId(projectId) {
  try {
    const configs = await db.modelConfig.findMany({ where: { projectId } });
    // 从 .env 文件读取 apiKey 并添加到配置中
    return configs.map(config => {
      const apiKey = getModelApiKey(config.id);
      return {
        ...config,
        apiKey: apiKey || config.apiKey || '' // 优先使用 .env 中的值
      };
    });
  } catch (error) {
    console.error('Failed to get modelConfig by projectId in database');
    throw error;
  }
}

export async function createInitModelConfig(data) {
  try {
    // 提取 apiKey 并保存到 .env 文件
    const dataWithApiKeys = data.map(item => {
      const { apiKey, ...dbItem } = item;
      // 确保 apiKey 字段为 null（因为数据库中是可选字段）
      dbItem.apiKey = null;
      // 如果提供了 apiKey，保存到 .env 文件
      if (apiKey && item.id) {
        saveModelApiKey(item.id, apiKey);
      }
      return dbItem;
    });
    
    // MySQL 不支持 createManyAndReturn，先创建再查询
    await db.modelConfig.createMany({ data: dataWithApiKeys });
    // 根据 projectId 和 id 列表查询返回创建的数据
    if (data.length > 0 && data[0].projectId) {
      const projectId = data[0].projectId;
      const ids = data.map(item => item.id).filter(Boolean);
      let configs = [];
      if (ids.length > 0) {
        configs = await db.modelConfig.findMany({
          where: {
            projectId,
            id: { in: ids }
          }
        });
      } else {
        // 如果没有 id，根据 projectId 查询所有
        configs = await db.modelConfig.findMany({
          where: { projectId },
          orderBy: { createAt: 'desc' },
          take: data.length
        });
      }
      
      // 从 .env 文件读取 apiKey 并添加到配置中
      return configs.map(config => {
        const apiKey = getModelApiKey(config.id);
        return {
          ...config,
          apiKey: apiKey || ''
        };
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
    const config = await db.modelConfig.findUnique({ where: { id } });
    if (config) {
      // 从 .env 文件读取 apiKey 并添加到配置中
      const apiKey = getModelApiKey(id);
      return {
        ...config,
        apiKey: apiKey || config.apiKey || '' // 优先使用 .env 中的值
      };
    }
    return config;
  } catch (error) {
    console.error('Failed to get modelConfig by id in database');
    throw error;
  }
}

export async function deleteModelConfigById(id) {
  try {
    // 删除 .env 文件中的 apiKey
    const envName = getModelApiKeyEnvName(id);
    deleteEnvVariable(envName);
    
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
    
    // 提取 apiKey，保存到 .env 文件
    const apiKey = models.apiKey || '';
    const modelConfigId = models.id;
    
    // 从 models 对象中移除 apiKey，不存储到数据库
    const { apiKey: _, ...dbData } = models;
    // 确保 apiKey 字段为 null（因为数据库中是可选字段）
    dbData.apiKey = null;
    
    // 保存到数据库（不包含 apiKey）
    const result = await db.modelConfig.upsert({ 
      create: dbData, 
      update: dbData, 
      where: { id: modelConfigId } 
    });
    
    // 将 apiKey 保存到 .env 文件（即使是空字符串也会处理）
    saveModelApiKey(modelConfigId, apiKey);
    
    // 返回结果时，从 .env 文件读取 apiKey
    const savedApiKey = getModelApiKey(modelConfigId);
    return {
      ...result,
      apiKey: savedApiKey || ''
    };
  } catch (error) {
    console.error('Failed to create modelConfig in database');
    throw error;
  }
}
