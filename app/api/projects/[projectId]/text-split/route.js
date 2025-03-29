import { NextResponse } from 'next/server';
import { saveFile, getProject, saveTextChunk } from '@/lib/db/index';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// 用于处理文本分割的函数
function splitTextContent(text, minChars = 1500, maxChars = 2000) {
  // 基本的分割算法，按照段落分割，然后合并到合适的长度
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // 如果当前段落很长，需要进一步分割
    if (paragraph.length > maxChars) {
      // 如果当前chunk不为空，先添加到chunks
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
      }

      // 按句子分割长段落
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      let sentenceChunk = '';

      for (const sentence of sentences) {
        if (sentenceChunk.length + sentence.length <= maxChars) {
          sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
        } else {
          chunks.push(sentenceChunk);
          sentenceChunk = sentence;
        }
      }

      if (sentenceChunk.length > 0) {
        currentChunk = sentenceChunk;
      }
    } else {
      // 尝试将段落添加到当前chunk
      if (currentChunk.length + paragraph.length + 2 <= maxChars) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        // 如果当前chunk至少达到了最小长度，添加到chunks
        if (currentChunk.length >= minChars) {
          chunks.push(currentChunk);
          currentChunk = paragraph;
        } else {
          // 否则继续添加，即使超过了最大长度
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
      }
    }
  }

  // 添加最后一个chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// 从Markdown中提取目录结构
function extractDirectoryFromMarkdown(text) {
  const headings = text.match(/^#{1,6}\s+(.+)$/gm) || [];

  // 映射标题级别和内容
  return headings.map(heading => {
    const level = heading.match(/^(#{1,6})\s/)[1].length;
    const content = heading.replace(/^#{1,6}\s+/, '');
    return { level, content };
  });
}

export async function POST(request, { params }) {
  try {
    const { projectId } = params;

    // 获取项目信息
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project does not exist' }, { status: 404 });
    }

    // 文本分割设置
    const settings = project.settings || {};
    const textSplitSettings = settings.textSplit || { minChars: 1500, maxChars: 2000 };

    // 获取上传的文件
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      // 只处理Markdown文件
      if (!file.name.toLowerCase().endsWith('.md')) {
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;

      // 保存原始文件
      await saveFile(projectId, buffer, fileName);

      // 读取文件内容并分割
      const text = buffer.toString('utf-8');

      // 提取目录结构
      const directory = extractDirectoryFromMarkdown(text);

      // 分割文本
      const chunks = splitTextContent(text, textSplitSettings.minChars, textSplitSettings.maxChars);

      // 保存分割后的文本片段
      const chunkResults = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = uuidv4();
        const chunkData = {
          id: chunkId,
          title: `${fileName}-片段${i + 1}`,
          content: chunks[i],
          wordCount: chunks[i].length,
          fileName: fileName,
          hasQuestions: false,
          createdAt: new Date().toISOString()
        };

        await saveTextChunk(projectId, chunkId, chunkData);
        chunkResults.push(chunkData);
      }

      results.push({
        fileName,
        chunksCount: chunks.length,
        directory,
        chunks: chunkResults.map(chunk => ({
          id: chunk.id,
          title: chunk.title,
          wordCount: chunk.wordCount
        }))
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to split text:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 获取项目中所有文本片段
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 获取项目信息
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project does not exist' }, { status: 404 });
    }

    // 获取所有文本片段
    const chunkIds = await getTextChunkIds(projectId);
    const chunks = [];

    for (const chunkId of chunkIds) {
      const chunk = await getTextChunk(projectId, chunkId);
      chunks.push(chunk);
    }

    return NextResponse.json(chunks);
  } catch (error) {
    console.error('Failed to get text chunks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
