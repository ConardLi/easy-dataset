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
  console.log('文件上传请求开始处理, 参数:', params);
  const { projectId } = params;

  // 验证项目ID
  if (!projectId) {
    console.log('项目ID为空，返回400错误');
    return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
  }

  console.log('开始获取项目信息, projectId:', projectId);
  // 获取项目信息
  const project = await getProject(projectId);
  if (!project) {
    console.log('项目不存在，返回404错误');
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }
  console.log('项目信息获取成功:', project.name || project.id);

  try {
    console.log('尝试使用备用方法处理文件上传...');

    // 检查请求头中是否包含文件名
    const encodedFileName = request.headers.get('x-file-name');
    const fileName = encodedFileName ? decodeURIComponent(encodedFileName) : null;
    console.log('从请求头获取文件名:', fileName);

    if (!fileName) {
      console.log('请求头中没有文件名');
      return NextResponse.json({ error: '请求头中缺少文件名 (x-file-name)' }, { status: 400 });
    }

    // 检查文件类型
    if (!fileName.endsWith('.md')&&!fileName.endsWith('.txt')) {
      console.log('文件类型不支持:', fileName);
      return NextResponse.json({ error: '只支持上传Markdown文件' }, { status: 400 });
    }

    // 直接从请求体中读取二进制数据
    console.log('开始读取请求体数据...');
    const fileBuffer = Buffer.from(await request.arrayBuffer());
    console.log('请求体数据读取成功, 大小:', fileBuffer.length, 'bytes');

    // 保存文件
    console.log('获取项目根目录...');
    const projectRoot = await getProjectRoot();
    console.log('项目根目录:', projectRoot);
    const projectPath = path.join(projectRoot, projectId);
    const filesDir = path.join(projectPath, 'files');
    console.log('文件将保存到:', filesDir);

    console.log('确保目录存在...');
    await ensureDir(filesDir);
    console.log('目录已确认存在');

    const filePath = path.join(filesDir, fileName);
    console.log('开始写入文件:', filePath);
    await fs.writeFile(filePath, fileBuffer);
    console.log('文件写入成功');

    // 更新项目配置，添加上传的文件记录
    console.log('更新项目配置...');
    const uploadedFiles = project.uploadedFiles || [];
    if (!uploadedFiles.includes(fileName)) {
      uploadedFiles.push(fileName);

      // 更新项目配置
      console.log('保存更新后的项目配置...');
      await updateProject(projectId, {
        ...project,
        uploadedFiles
      });
      console.log('项目配置更新成功');
    } else {
      console.log('文件已存在于项目配置中，无需更新');
    }

    console.log('文件上传处理完成，返回成功响应');
    return NextResponse.json({
      message: '文件上传成功',
      fileName,
      filePath
    });
  } catch (error) {
    console.error('上传文件处理过程中出错:', error);
    console.error('错误堆栈:', error.stack);
    return NextResponse.json({
      error: '文件上传失败: ' + (error.message || '未知错误')
    }, { status: 500 });
  }
}
