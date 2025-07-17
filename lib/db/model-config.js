'use server';
import { db } from '@/lib/db/index';
import { nanoid } from 'nanoid';

// Get all model configurations
export async function getAllModelConfigs() {
  try {
    return await db.modelConfig.findMany();
  } catch (error) {
    console.error('Failed to get all modelConfigs from database');
    throw error;
  }
}

// Kept for potential legacy use, but should be deprecated.
export async function getModelConfigByProjectId(projectId) {
  console.warn("DEPRECATED: getModelConfigByProjectId is called. Model configs are now global.");
  return []; // Returning empty array to avoid breaking old code that might call this.
}

export async function createModelConfig(data) {
  try {
    // Ensure projectId is not part of the data
    const { projectId, ...rest } = data;
    if (!rest.id) {
      rest.id = nanoid(12);
    }
    return await db.modelConfig.create({ data: rest });
  } catch (error) {
    console.error('Failed to create modelConfig in database');
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

export async function updateModelConfig(id, data) {
  try {
    // Ensure projectId is not part of the update data
    const { projectId, ...updateData } = data;
    return await db.modelConfig.update({
      where: { id },
      data: updateData,
    });
  } catch (error)
  {
    console.error('Failed to update modelConfig in database');
    throw error;
  }
}

export async function saveModelConfig(models) {
  try {
    const { projectId, ...modelData } = models;
    if (!modelData.id) {
      modelData.id = nanoid(12);
    }
    return await db.modelConfig.upsert({ create: modelData, update: modelData, where: { id: modelData.id } });
  } catch (error) {
    console.error('Failed to save modelConfig in database');
    throw error;
  }
}
