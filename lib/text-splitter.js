'use server';

import fs from 'fs';
import path from 'path';
import {
  getProjectRoot,
  ensureDir,
  readJsonFile
} from './db/base';
import { saveTextChunk } from './db/texts';
import { getQuestionsForChunk } from './db/questions'
import { getFiles } from '@/lib/db/texts';
import { getProject} from '@/lib/db/projects';

// 导入Markdown分割工具
const markdownSplitter = require('./split-mardown/index');

/**
 * 分割项目中的Markdown文件
 * @param {string} projectId - 项目ID
 * @param {string} fileName - 文件名
 * @returns {Promise<Array>} - 分割结果数组
 */
export async function splitProjectFile(projectId, fileName) {
  try {
    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);

    // 获取文件列表
    const files = await getFiles(projectId);
    const project = await getProject(projectId);
    fileName = project.name;

    // 获取任务配置
    const taskConfigPath = path.join(projectPath, 'task-config.json');
    let taskConfig;

    try {
      await fs.promises.access(taskConfigPath);
      const taskConfigData = await fs.promises.readFile(taskConfigPath, 'utf8');
      taskConfig = JSON.parse(taskConfigData);
    } catch (error) {
      // 如果配置文件不存在，使用默认配置
      taskConfig = {
        textSplitMinLength: 1500,
        textSplitMaxLength: 2000
      };
    }

    // 获取分割参数
    const minLength = taskConfig.textSplitMinLength || 1500;
    const maxLength = taskConfig.textSplitMaxLength || 2000;

    // 确保chunks目录存在
    const chunksDir = path.join(projectPath, 'chunks');
    await ensureDir(chunksDir);

    // 保存所有分割结果
    let savedChunks = [];
    let filesContent = "";

    // 循环处理每个文件
    for (let i = 0; i < files.length; i++) {
      // 检查文件是否存在
      try {
        await fs.promises.access(files[i].path);
      } catch (error) {
        throw new Error(`文件 ${files[i].name} 不存在`);
      }

      // 读取文件内容
      const fileContent = await fs.promises.readFile(files[i].path, 'utf8');

      filesContent += fileContent;

      // 分割文本
      const splitResult = markdownSplitter.splitMarkdown(fileContent, minLength, maxLength);

      // 保存分割结果到chunks目录
      const chunks = await Promise.all(
        splitResult.map(async (part, index) => {
          const chunkId = `${path.basename(files[i].name, path.extname(files[i].name))}-part-${index + 1}`;
          await saveTextChunk(projectId, chunkId, part.result);

          return {
            id: chunkId,
            content: part.content,
            summary: part.summary,
            length: part.content.length,
            fileName: files[i].name
          };
        })
      );

      // 将当前文件的分割结果添加到总结果中
      savedChunks = savedChunks.concat(chunks);
    }

    // 提取目录结构（如果需要所有文件的内容拼接后再提取目录）
    //const filesContent = savedChunks.map(chunk => chunk.content).join('\n');
    const tocJSON = markdownSplitter.extractTableOfContents(filesContent);
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
export async function getProjectChunks(projectId) {
  try {
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const chunksDir = path.join(projectPath, 'chunks');
    const tocDir = path.join(projectPath, 'toc');
    const project = await getProject(projectId);

    // 检查chunks目录是否存在
    try {
      await fs.promises.access(chunksDir);
    } catch (error) {
      return { chunks: [] };
    }

    // 读取所有文本块文件
    const files = await fs.promises.readdir(chunksDir);
    const chunkFiles = files.filter(file => file.endsWith('.txt'));

    // 按文件名分组文本块
    const chunksByFile = {};

    for (const chunkFile of chunkFiles) {
      const chunkId = chunkFile.replace('.txt', '');
      const chunkPath = path.join(chunksDir, chunkFile);
      const content = await fs.promises.readFile(chunkPath, 'utf8');

      // 从文本块ID中提取文件名
      // 格式为: filename-part-X
      const fileNameMatch = chunkId.match(/(.+)-part-\d+/);
      const fileName = fileNameMatch ? `${fileNameMatch[1]}.md` : null;

      if (fileName) {
        if (!chunksByFile[fileName]) {
          chunksByFile[fileName] = [];
        }
        const questions = await getQuestionsForChunk(projectId, chunkId);

        chunksByFile[fileName].push({
          id: chunkId,
          content: content.substring(0, 200) + (content.length > 200 ? '...' : ''), // 只返回前200个字符作为预览
          summary: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          length: content.length,
          fileName: fileName,
          questions
        });
      }
    }

    // 读取所有TOC文件
    const tocByFile = {};
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
      fileName:project.name+".md",
      totalChunks: 0,
      chunks: [],
      toc: markdownSplitter.tocToMarkdown(tocByFile[project.name+".md"], { isNested: true })
    };

    //取出所有chunks
    for (const fileName in chunksByFile) {
      const chunks = chunksByFile[fileName];
      fileResult.totalChunks +=chunks.length;
      chunks.forEach(element => {
        fileResult.chunks.push(element);
      });
    }

    return {
      fileResult, // 单个文件结果，而不是数组
      chunks: chunkFiles.map(file => file.replace('.txt', ''))
    };
  } catch (error) {
    console.error('获取文本块出错:', error);
    throw error;
  }
}

/**
 * 获取文本块内容
 * @param {string} projectId - 项目ID
 * @param {string} chunkId - 文本块ID
 * @returns {Promise<Object>} - 文本块内容
 */
export async function getChunkContent(projectId, chunkId) {
  try {
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const chunkPath = path.join(projectPath, 'chunks', `${chunkId}.txt`);

    try {
      await fs.promises.access(chunkPath);
    } catch (error) {
      throw new Error(`文本块 ${chunkId} 不存在`);
    }

    const content = await fs.promises.readFile(chunkPath, 'utf8');

    return {
      id: chunkId,
      content
    };
  } catch (error) {
    console.error('获取文本块内容出错:', error);
    throw error;
  }
}
