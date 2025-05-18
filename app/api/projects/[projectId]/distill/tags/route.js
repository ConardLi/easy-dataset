import { NextResponse } from 'next/server';
import { distillTagsPrompt } from '@/lib/llm/prompts/distillTags';
import { distillTagsEnPrompt } from '@/lib/llm/prompts/distillTagsEn';
import { db } from '@/lib/db';
import { getProject } from '@/lib/db/projects';

const LLMClient = require('@/lib/llm/core');

/**
 * 生成标签接口：根据顶级主题、某级标签构造指定数量的子标签
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    const { parentTag, parentTagId, tagPath, count = 10, model, language = 'zh' } = await request.json();

    if (!parentTag) {
      const errorMsg = language === 'en' ? 'Topic tag name cannot be empty' : '主题标签名称不能为空';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // 查询现有标签
    const existingTags = await db.tags.findMany({
      where: {
        projectId,
        parentId: parentTagId || null
      }
    });

    const existingTagNames = existingTags.map(tag => tag.label);

    // 创建LLM客户端
    const llmClient = new LLMClient(model);

    // 获取项目配置
    const project = await getProject(projectId);
    const { globalPrompt } = project || {};

    // 生成提示词
    const promptFunc = language === 'en' ? distillTagsEnPrompt : distillTagsPrompt;
    const prompt = promptFunc(tagPath, parentTag, existingTagNames, count, globalPrompt);

    // 调用大模型生成标签
    const { answer } = await llmClient.getResponseWithCOT(prompt);

    // 解析返回的标签
    let tags = [];

    try {
      tags = JSON.parse(answer);
    } catch (error) {
      console.error('解析标签JSON失败:', error);
      // 尝试使用正则表达式提取标签
      const matches = answer.match(/"([^"]+)"/g);
      if (matches) {
        tags = matches.map(match => match.replace(/"/g, ''));
      }
    }

    // 保存标签到数据库
    const savedTags = [];
    for (let i = 0; i < tags.length; i++) {
      const tagName = tags[i];
      try {
        const tag = await db.tags.create({
          data: {
            label: tagName,
            projectId,
            parentId: parentTagId || null
          }
        });
        savedTags.push(tag);
      } catch (error) {
        console.error(`[标签生成] 保存标签 ${tagName} 失败:`, error);
        throw error;
      }
    }
    return NextResponse.json(savedTags);
  } catch (error) {
    console.error('[标签生成] 生成标签失败:', error);
    console.error('[标签生成] 错误堆栈:', error.stack);
    return NextResponse.json({ error: error.message || '生成标签失败' }, { status: 500 });
  }
}
