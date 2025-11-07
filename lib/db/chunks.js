'use server';
import { db } from '@/lib/db/index';
import { ensureDir, getProjectRoot } from '@/lib/db/base';
import path from 'path';
import fs from 'fs';

export async function saveChunks(chunks) {
  try {
    if (!chunks || chunks.length === 0) {
      console.warn('[saveChunks] chunks数组为空，跳过保存');
      return { count: 0 };
    }
    
    console.log(`[saveChunks] 准备保存 ${chunks.length} 个文本块`);
    
    // 验证每个chunk的必需字段
    const validChunks = chunks.filter((chunk, index) => {
      const requiredFields = ['projectId', 'name', 'fileId', 'fileName', 'content', 'summary', 'size'];
      const missingFields = requiredFields.filter(field => chunk[field] === undefined || chunk[field] === null);
      
      if (missingFields.length > 0) {
        console.warn(`[saveChunks] 文本块 ${index + 1} (${chunk.name || 'unknown'}) 缺少必需字段: ${missingFields.join(', ')}`);
        return false;
      }
      
      if (!chunk.content || chunk.content.trim().length === 0) {
        console.warn(`[saveChunks] 文本块 ${index + 1} (${chunk.name || 'unknown'}) 内容为空，跳过`);
        return false;
      }
      
      return true;
    });
    
    if (validChunks.length === 0) {
      console.error('[saveChunks] 没有有效的文本块可以保存');
      throw new Error('没有有效的文本块可以保存');
    }
    
    if (validChunks.length < chunks.length) {
      console.warn(`[saveChunks] 过滤了 ${chunks.length - validChunks.length} 个无效的文本块`);
    }
    
    const result = await db.chunks.createMany({ data: validChunks });
    console.log(`[saveChunks] 成功保存 ${result.count} 个文本块到数据库`);
    return result;
  } catch (error) {
    console.error('[saveChunks] 保存文本块失败:', error);
    console.error('[saveChunks] 错误详情:', error.message);
    if (chunks && chunks.length > 0) {
      console.error('[saveChunks] 第一个文本块示例:', JSON.stringify(chunks[0], null, 2));
    }
    throw error;
  }
}

export async function getChunkById(chunkId) {
  try {
    return await db.chunks.findUnique({ where: { id: chunkId } });
  } catch (error) {
    console.error('Failed to get chunks by id in database');
    throw error;
  }
}

export async function getChunksByFileIds(fileIds) {
  try {
    return await db.chunks.findMany({
      where: { fileId: { in: fileIds } },
      include: {
        Questions: {
          select: {
            question: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to get chunks by id in database');
    throw error;
  }
}

// 获取项目中所有文本片段的ID
export async function getChunkByProjectId(projectId, filter) {
  try {
    const whereClause = {
      projectId,
      NOT: {
        name: {
          in: ['Image Chunk', 'Distilled Content']
        }
      }
    };
    if (filter === 'generated') {
      whereClause.Questions = {
        some: {}
      };
    } else if (filter === 'ungenerated') {
      whereClause.Questions = {
        none: {}
      };
    }
    return await db.chunks.findMany({
      where: whereClause,
      include: {
        Questions: {
          select: {
            question: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to get chunks by projectId in database');
    throw error;
  }
}

export async function deleteChunkById(chunkId) {
  try {
    const delQuestions = db.questions.deleteMany({ where: { chunkId } });
    const delChunk = db.chunks.delete({ where: { id: chunkId } });
    return await db.$transaction([delQuestions, delChunk]);
  } catch (error) {
    console.error('Failed to delete chunks by id in database');
    throw error;
  }
}

/**
 * 根据文本块名称获取文本块
 * @param {string} projectId - 项目ID
 * @param {string} chunkName - 文本块名称
 * @returns {Promise} - 查询结果
 */
export async function getChunkByName(projectId, chunkName) {
  try {
    return await db.chunks.findFirst({
      where: {
        projectId,
        name: chunkName
      }
    });
  } catch (error) {
    console.error('根据名称获取文本块失败', error);
    throw error;
  }
}

/**
 * 批量根据文本块名称获取文本块内容
 * @param {string} projectId - 项目ID
 * @param {string[]} chunkNames - 文本块名称数组
 * @returns {Promise<Object>} - 以 chunkName 为 key，content 为 value 的对象
 */
export async function getChunkContentsByNames(projectId, chunkNames) {
  try {
    if (!chunkNames || chunkNames.length === 0) {
      return {};
    }

    const chunks = await db.chunks.findMany({
      where: {
        projectId,
        name: { in: chunkNames }
      },
      select: {
        name: true,
        content: true
      }
    });

    // 转换为 name -> content 的映射
    const contentMap = {};
    chunks.forEach(chunk => {
      contentMap[chunk.name] = chunk.content;
    });

    return contentMap;
  } catch (error) {
    console.error('批量获取文本块内容失败', error);
    throw error;
  }
}

/**
 * 根据文件ID删除所有相关文本块
 * @param {string} projectId - 项目ID
 * @param {string} fileId - 文件ID
 * @returns {Promise} - 删除操作的结果
 */
export async function deleteChunksByFileId(projectId, fileId) {
  try {
    // 查找与该文件相关的所有文本块
    const chunks = await db.chunks.findMany({
      where: { projectId, fileId },
      select: { id: true }
    });

    // 提取文本块ID
    const chunkIds = chunks.map(chunk => chunk.id);

    // 如果没有找到文本块，直接返回
    if (chunkIds.length === 0) {
      return { count: 0 };
    }

    // 删除相关的问题
    const delQuestions = db.questions.deleteMany({
      where: { chunkId: { in: chunkIds } }
    });

    // 删除文本块
    const delChunks = db.chunks.deleteMany({
      where: { id: { in: chunkIds } }
    });

    // 使用事务确保原子性操作
    const result = await db.$transaction([delQuestions, delChunks]);

    return { count: result[1].count };
  } catch (error) {
    console.error('删除文件相关文本块失败:', error);
    throw error;
  }
}

export async function updateChunkById(chunkId, chunkData) {
  try {
    return await db.chunks.update({ where: { id: chunkId }, data: chunkData });
  } catch (error) {
    console.error('Failed to update chunks by id in database');
    throw error;
  }
}

// 删除文件及相关TOC文件
// TODO 后期优化 将文件也新增表结构关联 防止删除错误
export async function deleteChunkAndFile(projectId, fileName) {
  try {
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const filesDir = path.join(projectPath, 'files');
    const tocDir = path.join(projectPath, 'toc');

    // 确保目录存在
    await ensureDir(tocDir);

    // 删除原始文件
    const filePath = path.join(filesDir, fileName);
    try {
      await fs.promises.access(filePath);
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error(`删除文件 ${fileName} 失败:`, error);
      // 如果文件不存在，继续处理
    }

    // 删除相关的TOC文件
    const baseName = path.basename(fileName, path.extname(fileName));
    const tocPath = path.join(filesDir, `${baseName}-toc.json`);
    try {
      await fs.promises.access(tocPath);
      await fs.promises.unlink(tocPath);
    } catch (error) {
      // 如果TOC文件不存在，继续处理
    }

    // TODO 暂不删除数据库中Chunk数据 如果删除 Question Dataset关联的Chunk数据是否也要删除？
    // return await db.chunks.deleteMany({
    //     where: {
    //         name: {
    //             startsWith: baseName + '-part-',
    //         }, projectId
    //     }
    // });
  } catch (error) {
    console.error('Failed to delete chunks by id in database');
    throw error;
  }
}

// 更新文本块内容
export async function updateChunkContent(chunkId, newContent) {
  try {
    return await db.chunks.update({
      where: { id: chunkId },
      data: {
        content: newContent,
        size: newContent.length
      }
    });
  } catch (error) {
    console.error('Failed to update chunk content in database');
    throw error;
  }
}

// 获取文本块列表（支持分页）
export async function getChunks(projectId, page = 1, pageSize = 20) {
  try {
    const whereClause = {
      projectId,
      NOT: {
        name: {
          in: ['Image Chunk', 'Distilled Content']
        }
      }
    };

    const [data, total] = await Promise.all([
      db.chunks.findMany({
        where: whereClause,
        orderBy: {
          createAt: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.chunks.count({
        where: whereClause
      })
    ]);

    return {
      data,
      total,
      page,
      pageSize
    };
  } catch (error) {
    console.error('Failed to get chunks with pagination:', error);
    throw error;
  }
}
