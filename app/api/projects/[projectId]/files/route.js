import { NextResponse } from 'next/server';
import { getFiles, deleteFile } from '@/lib/db/texts';
import { getProject, updateProject } from '@/lib/db/projects';
import path from 'path';
import { writeFile } from 'fs/promises';
import { getProjectRoot, ensureDir } from '@/lib/db/base';

// 获取项目文件列表
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    // 获取文件列表
    const files = await getFiles(projectId);

    return NextResponse.json({ files });
  } catch (error) {
    console.error('获取文件列表出错:', error);
    return NextResponse.json({ error: error.message || '获取文件列表失败' }, { status: 500 });
  }
}

// 删除文件
export async function DELETE(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    // 验证项目ID和文件名
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }
    
    if (!fileName) {
      return NextResponse.json({ error: '文件名不能为空' }, { status: 400 });
    }

    // 获取项目信息
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 删除文件及相关数据
    const result = await deleteFile(projectId, fileName);
    
    // 更新项目配置，移除已删除的文件
    const uploadedFiles = project.uploadedFiles || [];
    const updatedFiles = uploadedFiles.filter(f => f !== fileName);
    
    await updateProject(projectId, {
      ...project,
      uploadedFiles: updatedFiles
    });

    return NextResponse.json({
      message: '文件删除成功',
      fileName
    });
  } catch (error) {
    console.error('删除文件出错:', error);
    return NextResponse.json({ error: error.message || '删除文件失败' }, { status: 500 });
  }
}

// 上传文件
export async function POST(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    // 获取项目信息
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 解析multipart/form-data请求
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
    }

    // 检查文件类型
    const fileName = file.name;
    // 支持多文件
    if (!fileName.endsWith('.md')&&!fileName.endsWith('.pdf')&&!fileName.endsWith('.doc')&&!fileName.endsWith('.docx')) {
      return NextResponse.json({ error: '只支持上传Markdown、PDF、Word文件' }, { status: 400 });
    }

    // 获取文件内容
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 保存文件
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const filesDir = path.join(projectPath, 'files');

    await ensureDir(filesDir);

    const filePath = path.join(filesDir, fileName);
    await writeFile(filePath, fileBuffer);

    // 更新项目配置，添加上传的文件记录
    const uploadedFiles = project.uploadedFiles || [];
    if (!uploadedFiles.includes(fileName)) {
      uploadedFiles.push(fileName);

      // 更新项目配置
      await updateProject(projectId, {
        ...project,
        uploadedFiles
      });
    }

    return NextResponse.json({
      message: '文件上传成功',
      fileName,
      filePath
    });
  } catch (error) {
    console.error('上传文件出错:', error);
    return NextResponse.json({ error: error.message || '上传文件失败' }, { status: 500 });
  }
}
