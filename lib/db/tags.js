'use server';

import path from 'path';
import { getProjectRoot, readJsonFile, writeJsonFile } from './base';

// 获取标签树
export async function getTags(projectId) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const tagsPath = path.join(projectPath, 'tags.json');

  try {
    return (await readJsonFile(tagsPath)) || [];
  } catch (error) {
    return [];
  }
}

// 保存整个标签树
export async function saveTags(projectId, tags) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const tagsPath = path.join(projectPath, 'tags.json');
  await writeJsonFile(tagsPath, tags);
  return tags;
}
