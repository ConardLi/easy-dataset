import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUploadFileInfoById } from '@/lib/db/upload-files';

/**
 * 高级 Markdown 分块预览 API
 * 只做分块计算和质量评估，不写入数据库
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const body = await request.json();
    const { fileId, config = {} } = body;

    if (!projectId || !fileId) {
      return NextResponse.json({ error: 'Missing required parameters: projectId, fileId' }, { status: 400 });
    }

    // 获取文件信息并读取内容
    const fileInfo = await getUploadFileInfoById(fileId);
    if (!fileInfo) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    let filePath = path.join(fileInfo.path, fileInfo.fileName);
    if (fileInfo.fileExt !== '.md') {
      filePath = path.join(fileInfo.path, fileInfo.fileName.replace(/\.[^/.]+$/, '.md'));
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // 调用高级分块引擎（CommonJS 模块，动态 require）
    const { splitAdvancedMarkdown } = require('@/lib/file/split-markdown/advanced/index');

    const advancedConfig = {
      minLength: config.minLength || 800,
      maxLength: config.maxLength || 2000,
      preserveHeadings: config.preserveHeadings !== false
    };

    const { chunks, stats, outline } = splitAdvancedMarkdown(fileContent, advancedConfig);

    return NextResponse.json({
      success: true,
      fileId,
      fileName: fileInfo.fileName,
      chunks,
      stats,
      outline,
      config: advancedConfig
    });
  } catch (error) {
    console.error('Advanced split preview error:', String(error));
    return NextResponse.json(
      { error: error.message || 'Failed to generate advanced split preview' },
      { status: 500 }
    );
  }
}
