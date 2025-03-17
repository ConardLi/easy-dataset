'use server';

import path from 'path';
import { getProjectRoot, readJsonFile, writeJsonFile } from './base';

// 获取问题列表
export async function getQuestions(projectId) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const questionsPath = path.join(projectPath, 'questions.json');
  await readJsonFile(questionsPath);
}

// 保存问题列表
export async function saveQuestions(projectId, questions) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const questionsPath = path.join(projectPath, 'questions.json');

  await writeJsonFile(questionsPath, questions);
  return questions;
}

// 获取标签树
export async function getTags(projectId) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const tagsPath = path.join(projectPath, 'tags.json');

  try {
    return await readJsonFile(tagsPath) || [];
  } catch (error) {
    return [];
  }
}

// 保存标签树
export async function saveTags(projectId, tags) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const tagsPath = path.join(projectPath, 'tags.json');

  await writeJsonFile(tagsPath, tags);
  return tags;
}

// 获取数据集列表
export async function getDatasets(projectId) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const datasetsPath = path.join(projectPath, 'datasets.json');
  return await readJsonFile(datasetsPath);
}

export async function getDataset(projectId, datasetId) {
  const datasets = await getDatasets(projectId);
  return datasets.find((dataset) => dataset.id === datasetId);
}

export async function updateDataset(projectId, datasetId, updatedDataset) {
  const datasets = await getDatasets(projectId);
  const index = datasets.findIndex((dataset) => dataset.id === datasetId);
  if (index !== -1) {
    datasets[index] = { ...datasets[index], ...updatedDataset };
    await saveDatasets(projectId, datasets);
  }
}

// 保存数据集列表
export async function saveDatasets(projectId, datasets) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const datasetsPath = path.join(projectPath, 'datasets.json');
  await writeJsonFile(datasetsPath, datasets);
  return datasets;
}
