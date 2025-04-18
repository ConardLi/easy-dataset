import { NextResponse } from 'next/server';
import PdfProcessor from '@/lib/pdf-processing/core';
import { deleteChunkAndFile } from '@/lib/db/chunks';
import { getProject, updateProject } from '@/lib/db/projects';

// Replace the deprecated config export with the new export syntax
export const dynamic = 'force-dynamic';
// This tells Next.js not to parse the request body automatically
export const bodyParser = false;

// 处理PDF文件
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    const fileName = request.nextUrl.searchParams.get('fileName');

    let strategy = request.nextUrl.searchParams.get('strategy');

    const currentLanguage = request.nextUrl.searchParams.get('currentLanguage');

    const visionModel = request.nextUrl.searchParams.get('modelId');

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }
    if (!fileName) {
      return NextResponse.json({ error: '文件名不能为空' }, { status: 400 });
    }

    //如果没有正确获取到strategy字段，则使用默认配置
    if (!strategy) {
      strategy = 'default';
    }

    // 获取项目信息
    const project = await getProject(projectId);

    // 创建处理器
    const processor = new PdfProcessor(strategy);

    // 使用当前策略处理
    const result = await processor.process(projectId, fileName, {
      language: currentLanguage,
      visionModelId: visionModel
    });

    //准换完成后删除pdf文件
    deleteChunkAndFile(projectId, fileName);

    // 更新项目配置，移除已删除的文件
    const uploadedFiles = JSON.parse(project.uploadedFiles) || [];
    const updatedFiles = uploadedFiles.filter(f => f !== fileName);
    await updateProject(projectId, {
      ...project,
      uploadedFiles: updatedFiles
    });
    //先检查PDF转换是否成功，再将转换后的文件写入配置
    if (!result.success) {
      throw new Error(result.error);
    }
    //将转换后文件加入到配置中
    if (!updatedFiles.includes(fileName)) {
      updatedFiles.push(fileName.replace('.pdf', '.md'));
    }
    await updateProject(projectId, {
      ...project,
      uploadedFiles: updatedFiles
    });

    return NextResponse.json({
      projectId,
      project,
      uploadedFiles: updatedFiles,
      batch_id: result.data
    });
  } catch (error) {
    console.error('PDF处理流程出错:', error);
    return NextResponse.json({ error: error.message || 'PDF处理流程' }, { status: 500 });
  }
}
