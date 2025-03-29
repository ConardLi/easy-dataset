import { NextResponse } from 'next/server';
import { getFiles, deleteFile } from '@/lib/db/texts';
import { getProject, updateProject } from '@/lib/db/projects';
import path from 'path';
import { getProjectRoot, ensureDir } from '@/lib/db/base';
import { promises as fs } from 'fs';

// Replace the deprecated config export with the new export syntax
export const dynamic = 'force-dynamic';
// This tells Next.js not to parse the request body automatically
export const bodyParser = false;

// 获取项目文件列表
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    // 获取文件列表
    const files = await getFiles(projectId);

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error obtaining file list:', error);
    return NextResponse.json({ error: error.message || 'Error obtaining file list' }, { status: 500 });
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
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ error: 'The file name cannot be empty' }, { status: 400 });
    }

    // 获取项目信息
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'The project does not exist' }, { status: 404 });
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
      message: 'File deleted successfully',
      fileName
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: error.message || 'Error deleting file' }, { status: 500 });
  }
}

// 上传文件
export async function POST(request, { params }) {
  console.log('File upload request processing, parameters:', params);
  const { projectId } = params;

  // 验证项目ID
  if (!projectId) {
    console.log('The project ID cannot be empty, returning 400 error');
    return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
  }

  // 获取项目信息
  const project = await getProject(projectId);
  if (!project) {
    console.log('The project does not exist, returning 404 error');
    return NextResponse.json({ error: 'The project does not exist' }, { status: 404 });
  }
  console.log('Project information retrieved successfully:', project.name || project.id);

  try {
    console.log('Try using alternate methods for file upload...');

    // 检查请求头中是否包含文件名
    const encodedFileName = request.headers.get('x-file-name');
    const fileName = encodedFileName ? decodeURIComponent(encodedFileName) : null;
    console.log('Get file name from request header:', fileName);

    if (!fileName) {
      console.log('The request header does not contain a file name');
      return NextResponse.json(
        { error: 'The request header does not contain a file name (x-file-name)' },
        { status: 400 }
      );
    }

    // 检查文件类型
    if (!fileName.endsWith('.md')&&!fileName.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only Markdown files are supported' }, { status: 400 });
    }

    // 直接从请求体中读取二进制数据
    const fileBuffer = Buffer.from(await request.arrayBuffer());

    // 保存文件
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const filesDir = path.join(projectPath, 'files');

    await ensureDir(filesDir);

    const filePath = path.join(filesDir, fileName);
    await fs.writeFile(filePath, fileBuffer);

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

    console.log('The file upload process is complete, and a successful response is returned');
    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName,
      uploadedFiles,
      filePath
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        error: 'File upload failed: ' + (error.message || 'Unknown error')
      },
      { status: 500 }
    );
  }
}
