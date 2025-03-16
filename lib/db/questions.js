'use server';

import fs from 'fs';
import path from 'path';
import { getProjectRoot, ensureDir, readJsonFile, writeJsonFile } from './base';

/**
 * 获取项目的所有问题
 * @param {string} projectId - 项目ID
 * @returns {Promise<Array>} - 问题列表
 */
export async function getQuestions(projectId) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const questionsPath = path.join(projectPath, 'questions.json');
  
  try {
    const questions = await readJsonFile(questionsPath);
    return questions || [];
  } catch (error) {
    console.error('获取问题列表失败:', error);
    return [];
  }
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
  const chunk = {...updatedQuestions[chunkIndex]};
  
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
      const chunk = {...questions[chunkIndex]};
      
      // 从文本块中移除指定问题
      chunk.questions = chunk.questions.filter(q => q.question !== questionId);
      
      // 更新文本块
      questions[chunkIndex] = chunk;
    }
  }
  
  // 保存更新后的问题列表
  return await saveQuestions(projectId, questions);
}


/**
 * 手工添加问题到项目
 * @param {string} projectId - 项目ID
 * @param {string} chunkId - 文本块ID
 * @param {Array} newQuestions - 新问题列表
 * @returns {Promise<Array>} - 更新后的问题列表
 */
export async function addQuestionsManul(projectId, chunkId, newQuestions) {
  const questions = await getQuestions(projectId);
  console.log("newQuestions:",newQuestions);
  // 检查是否已存在该文本块的问题
  const existingIndex = questions.findIndex(item => item.chunkId === chunkId);
  console.log("existingIndex:",questions[existingIndex]);
  if (existingIndex >= 0) {
    // 更新现有问题
    if(!questions[existingIndex].questions){
      questions[existingIndex].questions = newQuestions;
    }else{
      const mergedQuestions = [...new Set([...questions[existingIndex].questions, ...newQuestions])];
      questions[existingIndex].questions=mergedQuestions;
    }
  }
  
  return await saveQuestions(projectId, questions);
}
