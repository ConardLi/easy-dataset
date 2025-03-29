import { NextResponse } from 'next/server';
import { splitProjectFile, getProjectChunks } from '@/lib/text-splitter';
import LLMClient from '@/lib/llm/core/index';
import getLabelPrompt from '@/lib/llm/prompts/label';
import getLabelEnPrompt from '@/lib/llm/prompts/labelEn';
import { deleteFile } from '@/lib/db/texts';
import { getProject, updateProject } from '@/lib/db/projects';
import { saveTags, getTags } from '@/lib/db/tags';
const { extractJsonFromLLMOutput } = require('@/lib/llm/common/util');

// 处理文本分割请求
export async function POST(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    // 获取请求体
    const { fileName, model, language } = await request.json();

    if (!model) {
      return NextResponse.json({ error: '请选择模型' }, { status: 400 });
    }

    // 验证文件名
    if (!fileName) {
      return NextResponse.json({ error: '文件名不能为空' }, { status: 400 });
    }
    const project = await getProject(projectId);
    const { globalPrompt, domainTreePrompt } = project;

    // 分割文本
    const result = await splitProjectFile(projectId, fileName);

    const { toc } = result;
    const llmClient = new LLMClient({
      provider: model.provider,
      endpoint: model.endpoint,
      apiKey: model.apiKey,
      model: model.name,
      temperature: model.temperature
    });
    // 生成领域树
    console.log(projectId, fileName, 'Text split completed, starting to build domain tree');
    const promptFunc = language === 'en' ? getLabelEnPrompt : getLabelPrompt;
    const prompt = promptFunc({ text: toc, globalPrompt, domainTreePrompt });
    const response = await llmClient.getResponse(prompt);
    const tags = extractJsonFromLLMOutput(response);

    if (!response || !tags) {
      // 删除前面生成的文件
      await deleteFile(projectId, fileName);
      const uploadedFiles = project.uploadedFiles || [];
      const updatedFiles = uploadedFiles.filter(f => f !== fileName);
      await updateProject(projectId, {
        ...project,
        uploadedFiles: updatedFiles
      });
      return NextResponse.json(
        { error: 'AI analysis failed, please check model configuration, delete file and retry!' },
        { status: 400 }
      );
    }
    console.log(projectId, fileName, 'Domain tree built:', tags);
    await saveTags(projectId, tags);

    return NextResponse.json({ ...result, tags });
  } catch (error) {
    console.error('Text split error:', error);
    return NextResponse.json({ error: error.message || 'Text split failed' }, { status: 500 });
  }
}

// 获取项目中的所有文本块
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    // 获取文本块详细信息
    const result = await getProjectChunks(projectId);

    const tags = await getTags(projectId);

    // 返回详细的文本块信息和文件结果（单个文件）
    return NextResponse.json({
      chunks: result.chunks,
      ...result.fileResult, // 单个文件结果，而不是数组
      tags
    });
  } catch (error) {
    console.error('Failed to get text chunks:', error);
    return NextResponse.json({ error: error.message || 'Failed to get text chunks' }, { status: 500 });
  }
}
