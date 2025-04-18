'use server';
import { db } from '@/lib/db/index';
import { ensureDir, getProjectRoot } from '@/lib/db/base';
import path from 'path';
import fs from 'fs';

export async function saveChunks(chunks) {
  try {
    return await db.chunks.createMany({ data: chunks });
  } catch (error) {
    console.error('Failed to create chunks in database');
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

// 获取项目中所有文本片段的ID
export async function getChunkByProjectId(projectId, filter) {
  try {
    const whereClause = {
      projectId
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
      where: whereClause
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
    return await prisma.$transaction([delQuestions, delChunk]);
  } catch (error) {
    console.error('Failed to delete chunks by id in database');
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
