import { NextResponse } from 'next/server';
import { getProject } from '@/lib/db/projects';
import path from 'path';
import { getProjectRoot, ensureDir } from '@/lib/db/base';
import { promises as fs } from 'fs';
import {
  checkUploadFileInfoByMD5,
  createUploadFileInfo,
  delUploadFileInfoById,
  getUploadFilesPagination
} from '@/lib/db/upload-files';
import { getFileMD5 } from '@/lib/util/file';
import { batchSaveTags } from '@/lib/db/tags';
import { getProjectChunks, getProjectTocByName } from '@/lib/file/text-splitter';
import { handleDomainTree } from '@/lib/util/domain-tree';

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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const pageSize = parseInt(searchParams.get('pageSize')) || 10; // 每页10个文件，支持分页
    const fileName = searchParams.get('fileName') || '';
    const getAllIds = searchParams.get('getAllIds') === 'true'; // 新增：获取所有文件ID的标志

    // 如果请求所有文件ID，直接返回ID列表
    if (getAllIds) {
      const allFiles = await getUploadFilesPagination(projectId, 1, 9999, fileName); // 获取所有文件
      const allFileIds = allFiles.data?.map(file => String(file.id)) || [];
      return NextResponse.json({ allFileIds });
    }
    // 获取文件列表
    const files = await getUploadFilesPagination(projectId, page, pageSize, fileName);

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error obtaining file list:', String(error));
    return NextResponse.json({ error: error.message || 'Error obtaining file list' }, { status: 500 });
  }
}

// 删除文件
export async function DELETE(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const domainTreeAction = searchParams.get('domainTreeAction') || 'keep';

    // 从请求体中获取模型信息和语言环境
    let model, language;
    try {
      const requestData = await request.json();
      model = requestData.model;
      language = requestData.language || '中文';
    } catch (error) {
      console.warn('解析请求体失败，使用默认值:', error);
      // 如果无法解析请求体，使用默认值
      model = {
        providerId: 'openai',
        modelName: 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY || ''
      };
      language = '中文';
    }

    // 验证项目ID和文件名
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    if (!fileId) {
      return NextResponse.json({ error: 'The file name cannot be empty' }, { status: 400 });
    }

    // 获取项目信息
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'The project does not exist' }, { status: 404 });
    }

    // 删除文件及其相关的文本块、问题和数据集
    const { stats, fileName, fileInfo } = await delUploadFileInfoById(fileId);
    const deleteToc = await getProjectTocByName(projectId, fileName);
    try {
      const projectRoot = await getProjectRoot();
      const projectPath = path.join(projectRoot, projectId);
      const tocDir = path.join(projectPath, 'toc');
      const baseName = path.basename(fileInfo.fileName, path.extname(fileInfo.fileName));
      const tocPath = path.join(tocDir, `${baseName}-toc.json`);

      // 检查文件是否存在再删除
      await fs.access(tocPath);
      await fs.unlink(tocPath);
      console.log(`成功删除 TOC 文件: ${tocPath}`);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        console.log('TOC 文件不存在，无需删除');
      } else {
        console.error(`删除 TOC 文件失败:`, String(error));
      }
      // 即使 TOC 文件删除失败，不影响整体结果
    }

    // 如果选择了保持领域树不变，直接返回删除结果
    if (domainTreeAction === 'keep') {
      return NextResponse.json({
        message: '文件删除成功',
        stats: stats,
        domainTreeAction: 'keep',
        cascadeDelete: true
      });
    }

    // 处理领域树更新
    try {
      // 获取项目的所有文件
      const { chunks, toc } = await getProjectChunks(projectId);

      // 如果不存在文本块，说明项目已经没有文件了
      if (!chunks || chunks.length === 0) {
        // 清空领域树
        await batchSaveTags(projectId, []);
        return NextResponse.json({
          message: '文件删除成功，领域树已清空',
          stats: stats,
          domainTreeAction,
          cascadeDelete: true
        });
      }

      // 调用领域树处理模块
      await handleDomainTree({
        projectId,
        action: domainTreeAction,
        allToc: toc,
        model,
        language,
        deleteToc,
        project
      });
    } catch (error) {
      console.error('Error updating domain tree after file deletion:', String(error));
      // 即使领域树更新失败，也不影响文件删除的结果
    }

    return NextResponse.json({
      message: '文件删除成功',
      stats: stats,
      domainTreeAction,
      cascadeDelete: true
    });
  } catch (error) {
    console.error('Error deleting file:', String(error));
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
    if (!fileName.endsWith('.md') && !fileName.endsWith('.pdf')) {
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
    //获取文件大小
    const stats = await fs.stat(filePath);
    //获取文件md5
    const md5 = await getFileMD5(filePath);
    //获取文件扩展名
    const ext = path.extname(filePath);

    // let res = await checkUploadFileInfoByMD5(projectId, md5);
    // if (res) {
    //   return NextResponse.json({ error: `【${fileName}】该文件已在此项目中存在` }, { status: 400 });
    // }

    let fileInfo = await createUploadFileInfo({
      projectId,
      fileName,
      size: stats.size,
      md5,
      fileExt: ext,
      path: filesDir
    });

    console.log('The file upload process is complete, and a successful response is returned');
    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName,
      filePath,
      fileId: fileInfo.id
    });
  } catch (error) {
    console.error('Error processing file upload:', String(error));
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        error: 'File upload failed: ' + (error.message || 'Unknown error')
      },
      { status: 500 }
    );
  }
}
