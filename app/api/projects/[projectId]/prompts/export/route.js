import { NextResponse } from 'next/server';
import { getAllCustomPrompts, getPromptTemplates } from '@/lib/db/custom-prompts';

const moduleCache = new Map();

async function loadDefaultContent(promptType, promptKey) {
  try {
    if (!moduleCache.has(promptType)) {
      const mod = await import(`@/lib/llm/prompts/${promptType}`);
      moduleCache.set(promptType, mod);
    }
    const mod = moduleCache.get(promptType);
    return mod[promptKey] || '';
  } catch {
    return '';
  }
}

export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const templates = await getPromptTemplates();
    const customPrompts = await getAllCustomPrompts(projectId);

    const customMap = new Map();
    for (const cp of customPrompts) {
      customMap.set(`${cp.promptType}:${cp.promptKey}:${cp.language}`, cp.content);
    }

    const prompts = [];
    for (const [categoryKey, category] of Object.entries(templates)) {
      for (const [promptKey, config] of Object.entries(category.prompts)) {
        const lang = promptKey.endsWith('_EN') ? 'en' : promptKey.endsWith('_TR') ? 'tr' : 'zh-CN';
        const dbKey = `${config.type}:${promptKey}:${lang}`;

        const defaultContent = await loadDefaultContent(config.type, promptKey);
        const isCustomized = customMap.has(dbKey);
        const customContent = customMap.get(dbKey) || '';

        prompts.push({
          category: categoryKey,
          promptType: config.type,
          promptKey,
          language: lang,
          name: config.name,
          description: config.description,
          defaultContent,
          content: isCustomized ? customContent : defaultContent,
          isCustomized
        });
      }
    }

    const exportData = {
      projectId,
      exportTime: new Date().toISOString(),
      version: '1.0',
      prompts
    };

    return NextResponse.json({
      success: true,
      data: exportData,
      total: prompts.length
    });
  } catch (error) {
    console.error('Export prompts failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
