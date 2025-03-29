'use server';

import fs from 'fs';
import path from 'path';
import os from 'os';

// 获取适合的数据存储目录
function getDbDirectory() {
  // 检查是否在浏览器环境中运行
  if (typeof window !== 'undefined') {
    // 检查是否在 Electron 渲染进程中运行
    if (window.electron && window.electron.getUserDataPath) {
      // 使用 preload 脚本中暴露的 API 获取用户数据目录
      const userDataPath = window.electron.getUserDataPath();
      if (userDataPath) {
        return path.join(userDataPath, 'local-db');
      }
    }

    // 如果不是 Electron 或获取失败，则使用开发环境的路径
    return path.join(process.cwd(), 'local-db');
  } else if (process.versions && process.versions.electron) {
    // 在 Electron 主进程中运行
    try {
      const { app } = require('electron');
      return path.join(app.getPath('userData'), 'local-db');
    } catch (error) {
      console.error('Failed to get user data directory:', error);
      // 降级处理，使用临时目录
      return path.join(os.homedir(), '.easy-dataset-db');
    }
  } else {
    // 在普通 Node.js 环境中运行（开发模式）
    return path.join(process.cwd(), 'local-db');
  }
}

// 项目根目录
const PROJECT_ROOT = getDbDirectory();

// 获取项目根目录
export async function getProjectRoot() {
  return PROJECT_ROOT;
}

// 确保数据库目录存在
export async function ensureDbExists() {
  try {
    await fs.promises.access(PROJECT_ROOT);
  } catch (error) {
    await fs.promises.mkdir(PROJECT_ROOT, { recursive: true });
  }
}

// 读取JSON文件
export async function readJsonFile(filePath) {
  try {
    await fs.promises.access(filePath);
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

// 写入JSON文件
export async function writeJsonFile(filePath, data) {
  // 使用临时文件策略，避免写入中断导致文件损坏
  const tempFilePath = `${filePath}_${Date.now()}.tmp`;
  try {
    // 序列化为JSON字符串
    const jsonString = JSON.stringify(data, null, 2);
    // 先写入临时文件
    await fs.promises.writeFile(tempFilePath, jsonString, 'utf8');

    // 从临时文件读取内容并验证
    try {
      const writtenContent = await fs.promises.readFile(tempFilePath, 'utf8');
      JSON.parse(writtenContent); // 验证JSON是否有效
      // 验证通过后，原子性地重命名文件替换原文件
      await fs.promises.rename(tempFilePath, filePath);
    } catch (validationError) {
      // 验证失败，删除临时文件并抛出错误
      await fs.promises.unlink(tempFilePath).catch(() => {});
      throw new Error(`写入的JSON文件内容无效: ${validationError.message}`);
    }
    return data;
  } catch (error) {
    console.error(`写入JSON文件 ${filePath} 失败:`, error);
    throw error;
  } finally {
    // 确保临时文件被删除
    await fs.promises.unlink(tempFilePath).catch(() => {});
  }
}

// 确保目录存在
export async function ensureDir(dirPath) {
  try {
    await fs.promises.access(dirPath);
  } catch (error) {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
}
