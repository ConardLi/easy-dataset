'use server';

import fs from 'fs';
import path from 'path';
import { getProjectRoot, ensureDir } from '../db/base';
import { getProject } from '@/lib/db/projects';
import { getChunkByProjectId, saveChunks } from '@/lib/db/chunks';
const {
  TokenTextSplitter,
  CharacterTextSplitter,
  RecursiveCharacterTextSplitter
} = require('@langchain/textsplitters');
const { Document } = require('@langchain/core/documents');

// 导入Markdown分割工具
const markdownSplitter = require('./split-markdown/index');

async function splitFileByType({ projectPath, fileContent, fileName, projectId, fileId }) {
  // 获取任务配置
  const taskConfigPath = path.join(projectPath, 'task-config.json');
  let taskConfig;

  try {
    await fs.promises.access(taskConfigPath);
    const taskConfigData = await fs.promises.readFile(taskConfigPath, 'utf8');
    taskConfig = JSON.parse(taskConfigData);
  } catch (error) {
    taskConfig = {
      textSplitMinLength: 1500,
      textSplitMaxLength: 2000
    };
  }
  // 获取分割参数
  const minLength = taskConfig.textSplitMinLength || 1500;
  const maxLength = taskConfig.textSplitMaxLength || 2000;
  const chunkSize = taskConfig.chunkSize || 1500;
  const chunkOverlap = taskConfig.chunkOverlap || 200;
  const separator = taskConfig.separator || '\n\n';
  const separators = taskConfig.separators || ['|', '##', '>', '-'];
  const splitLanguage = taskConfig.splitLanguage || 'js';
  const splitType = taskConfig.splitType;

  if (splitType === 'text') {
    // 字符分块
    const textSplitter = new CharacterTextSplitter({
      separator,
      chunkSize,
      chunkOverlap
    });
    const splitResult = await textSplitter.createDocuments([fileContent]);
    return splitResult.map((part, index) => {
      const chunkId = `${path.basename(fileName, path.extname(fileName))}-part-${index + 1}`;
      return {
        projectId,
        name: chunkId,
        fileId,
        fileName,
        content: part.pageContent,
        summary: '',
        size: part.pageContent.length
      };
    });
  } else if (splitType === 'token') {
    // Token 分块
    const textSplitter = new TokenTextSplitter({
      chunkSize,
      chunkOverlap
    });
    const splitResult = await textSplitter.splitText(fileContent);
    return splitResult.map((part, index) => {
      const chunkId = `${path.basename(fileName, path.extname(fileName))}-part-${index + 1}`;
      return {
        projectId,
        name: chunkId,
        fileId,
        fileName,
        content: part,
        summary: '',
        size: part.length
      };
    });
  } else if (splitType === 'code') {
    // 递归分块
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators
    });
    const jsSplitter = RecursiveCharacterTextSplitter.fromLanguage(splitLanguage, {
      chunkSize,
      chunkOverlap
    });
    const splitResult = await jsSplitter.createDocuments([fileContent]);
    return splitResult.map((part, index) => {
      const chunkId = `${path.basename(fileName, path.extname(fileName))}-part-${index + 1}`;
      return {
        projectId,
        name: chunkId,
        fileId,
        fileName,
        content: part.pageContent,
        summary: '',
        size: part.pageContent.length
      };
    });
  } else if (splitType === 'recursive') {
    // 递归分块
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators
    });
    const splitResult = await textSplitter.splitDocuments([new Document({ pageContent: fileContent })]);
    return splitResult.map((part, index) => {
      const chunkId = `${path.basename(fileName, path.extname(fileName))}-part-${index + 1}`;
      return {
        projectId,
        name: chunkId,
        fileId,
        fileName,
        content: part.pageContent,
        summary: '',
        size: part.pageContent.length
      };
    });
  } else if (splitType === 'custom') {
    // 自定义符号分块
    const customSeparator = taskConfig.customSeparator || '---';
    // 使用自定义分隔符分割文本，过滤掉空块
    const splitResult = fileContent.split(customSeparator).filter(content => content.trim().length > 0);

    return splitResult.map((part, index) => {
      const chunkId = `${path.basename(fileName, path.extname(fileName))}-part-${index + 1}`;
      // 去除首尾空白字符
      const trimmedContent = part.trim();
      return {
        projectId,
        name: chunkId,
        fileId,
        fileName,
        content: trimmedContent,
        summary: '',
        size: trimmedContent.length
      };
    });
  } else {
    // 默认采用之前的分块方法
    const splitResult = markdownSplitter.splitMarkdown(fileContent, minLength, maxLength);
    return splitResult.map((part, index) => {
      const chunkId = `${path.basename(fileName, path.extname(fileName))}-part-${index + 1}`;
      return {
        projectId,
        name: chunkId,
        fileId,
        fileName,
        content: part.content,
        summary: part.summary,
        size: part.content.length
      };
    });
  }
}

/**
 * 分割项目中的Markdown文件
 * @param {string} projectId - 项目ID
 * @param {string} fileName - 文件名
 * @returns {Promise<Array>} - 分割结果数组
 */
export async function splitProjectFile(projectId, file) {
  const { fileName, fileId } = file;
  try {
    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    let filePath = fileName;
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(projectPath, 'files', fileName);
    }
    try {
      await fs.promises.access(filePath);
    } catch (error) {
      throw new Error(`文件 ${fileName} 不存在`);
    }

    // 读取文件内容
    const fileContent = await fs.promises.readFile(filePath, 'utf8');

    // 保存分割结果到chunks目录
    const savedChunks = await splitFileByType({ projectPath, fileContent, fileName, projectId, fileId });
    await saveChunks(savedChunks);

    // 提取目录结构（如果需要所有文件的内容拼接后再提取目录）
    const tocJSON = markdownSplitter.extractTableOfContents(fileContent);
    const toc = markdownSplitter.tocToMarkdown(tocJSON, { isNested: true });

    // 保存目录结构到单独的toc文件夹
    const tocDir = path.join(projectPath, 'toc');
    await ensureDir(tocDir);
    const tocPath = path.join(tocDir, `${path.basename(fileName, path.extname(fileName))}-toc.json`);
    await fs.promises.writeFile(tocPath, JSON.stringify(tocJSON, null, 2));

    return {
      fileName,
      totalChunks: savedChunks.length,
      chunks: savedChunks,
      toc
    };
  } catch (error) {
    console.error('文本分割出错:', error);
    throw error;
  }
}

/**
 * 获取项目中的所有文本块
 * @param {string} projectId - 项目ID
 * @returns {Promise<Array>} - 文本块详细信息数组
 */
export async function getProjectChunks(projectId, filter) {
  try {
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const tocDir = path.join(projectPath, 'toc');
    const project = await getProject(projectId);

    let chunks = await getChunkByProjectId(projectId, filter);
    // 读取所有TOC文件
    const tocByFile = {};
    let toc = '';
    try {
      await fs.promises.access(tocDir);
      const tocFiles = await fs.promises.readdir(tocDir);

      for (const tocFile of tocFiles) {
        if (tocFile.endsWith('-toc.json')) {
          const tocPath = path.join(tocDir, tocFile);
          const tocContent = await fs.promises.readFile(tocPath, 'utf8');
          const fileName = tocFile.replace('-toc.json', '.md');

          try {
            tocByFile[fileName] = JSON.parse(tocContent);
            toc += '### File：' + fileName + '\n';
            toc += markdownSplitter.tocToMarkdown(tocByFile[fileName], { isNested: true }) + '\n';
          } catch (e) {
            console.error(`解析TOC文件 ${tocFile} 出错:`, e);
          }
        }
      }
    } catch (error) {
      // TOC目录不存在或读取出错，继续处理
    }
    // 整合结果
    let fileResult = {
      fileName: project.name + '.md',
      totalChunks: chunks.length,
      chunks,
      toc
    };

    return {
      fileResult, // 单个文件结果，而不是数组
      chunks
    };
  } catch (error) {
    console.error('获取文本块出错:', error);
    throw error;
  }
}

/**
 * 获取项目中的所有目录
 * @param {string} projectId - 项目ID
 */
export async function getProjectTocs(projectId) {
  try {
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const tocDir = path.join(projectPath, 'toc');

    // 读取所有TOC文件
    const tocByFile = {};
    let toc = '';
    try {
      await fs.promises.access(tocDir);
      const tocFiles = await fs.promises.readdir(tocDir);

      for (const tocFile of tocFiles) {
        if (tocFile.endsWith('-toc.json')) {
          const tocPath = path.join(tocDir, tocFile);
          const tocContent = await fs.promises.readFile(tocPath, 'utf8');
          const fileName = tocFile.replace('-toc.json', '.md');

          try {
            tocByFile[fileName] = JSON.parse(tocContent);
            toc += '### File：' + fileName + '\n';
            toc += markdownSplitter.tocToMarkdown(tocByFile[fileName], { isNested: true }) + '\n';
          } catch (e) {
            console.error(`解析TOC文件 ${tocFile} 出错:`, e);
          }
        }
      }
    } catch (error) {
      // TOC目录不存在或读取出错，继续处理
    }

    return toc;
  } catch (error) {
    console.error('获取文本块出错:', error);
    throw error;
  }
}

/**
 * 指定文件的目录
 */
export async function getProjectTocByName(projectId, fileName) {
  try {
    console.log(`[getProjectTocByName] projectId: ${projectId}, fileName: ${fileName}`);
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const tocDir = path.join(projectPath, 'toc');
    console.log(`[getProjectTocByName] tocDir: ${tocDir}`);

    // 读取所有TOC文件
    const tocByFile = {};
    let toc = '';
    try {
      await fs.promises.access(tocDir);
      const tocFiles = await fs.promises.readdir(tocDir);
      console.log(`[getProjectTocByName] Found toc files:`, tocFiles);
      const targetTocFile = fileName.replace('.md', '') + '-toc.json';
      console.log(`[getProjectTocByName] Looking for target file: ${targetTocFile}`);

      for (const tocFile of tocFiles) {
        if (tocFile.endsWith(fileName.replace('.md', '') + '-toc.json')) {
          console.log(`[getProjectTocByName] Found matching file: ${tocFile}`);
          const tocPath = path.join(tocDir, tocFile);
          const tocContent = await fs.promises.readFile(tocPath, 'utf8');
          const currentFileName = tocFile.replace('-toc.json', '.md');

          try {
            tocByFile[currentFileName] = JSON.parse(tocContent);
            toc += '### File：' + currentFileName + '\n';
            toc += markdownSplitter.tocToMarkdown(tocByFile[currentFileName], { isNested: true }) + '\n';
          } catch (e) {
            console.error(`解析TOC文件 ${tocFile} 出错:`, e);
          }
        }
      }
    } catch (error) {
      // TOC目录不存在或读取出错，继续处理
    }

    return toc;
  } catch (error) {
    console.error('获取文本块出错:', error);
    throw error;
  }
}
