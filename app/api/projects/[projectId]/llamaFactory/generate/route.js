import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getProjectRoot } from '@/lib/db/base';
import { getDatasets } from '@/lib/db/datasets';

export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { formatType, systemPrompt, confirmedOnly, includeCOT, reasoningLanguage } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const configPath = path.join(projectPath, 'dataset_info.json');
    const alpacaPath = path.join(projectPath, 'alpaca.json');
    const sharegptPath = path.join(projectPath, 'sharegpt.json');
    const multilingualThinkingPath = path.join(projectPath, 'multilingual-thinking.json');

    // 获取数据集
    let datasets = await getDatasets(projectId, !!confirmedOnly);

    // 创建 dataset_info.json 配置
    const config = {
      [`[HKGAI Dataset Generation] [${projectId}] Alpaca`]: {
        file_name: 'alpaca.json',
        columns: {
          prompt: 'instruction',
          query: 'input',
          response: 'output',
          system: 'system'
        }
      },
      [`[HKGAI Dataset Generation] [${projectId}] ShareGPT`]: {
        file_name: 'sharegpt.json',
        formatting: 'sharegpt',
        columns: {
          messages: 'messages'
        },
        tags: {
          role_tag: 'role',
          content_tag: 'content',
          user_tag: 'user',
          assistant_tag: 'assistant',
          system_tag: 'system'
        }
      },
      [`[HKGAI Dataset Generation] [${projectId}] multilingual-thinking`]: {
        file_name: 'multilingual-thinking.json',
        formatting: 'multilingual-thinking',
        columns: {
          messages: 'messages'
        },
        tags: {
          role_tag: 'role',
          content_tag: 'content',
          user_tag: 'user',
          assistant_tag: 'assistant',
          system_tag: 'system'
        }
      }
    };

    // 生成数据文件
    const alpacaData = datasets.map(({ question, answer, cot }) => ({
      instruction: question,
      input: '',
      output: cot && includeCOT ? `<think>${cot}</think>\n${answer}` : answer,
      system: systemPrompt || ''
    }));

    const sharegptData = datasets.map(({ question, answer, cot }) => {
      const messages = [];
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      messages.push({
        role: 'user',
        content: question
      });
      messages.push({
        role: 'assistant',
        content: cot && includeCOT ? `<think>${cot}</think>\n${answer}` : answer
      });
      return { messages };
    });
    const multilingualThinkingData = datasets.map(({ question, answer, cot }) => ({
      reasoning_language: reasoningLanguage ? reasoningLanguage : 'English',
      developer: systemPrompt ? systemPrompt : '', // system prompt (may be empty)
      user: question,
      analysis: includeCOT && cot ? cot : null, // null if no COT
      final: answer,
      messages: [
        {
          content: systemPrompt ? systemPrompt : '',
          role: 'system',
          thinking: null
        },
        {
          content: question,
          role: 'user',
          thinking: null
        },
        {
          content: answer,
          role: 'assistant',
          thinking: includeCOT && cot ? cot : null
        }
      ]
    }));

    const multilingualThinkingLines = multilingualThinkingData.map(item => JSON.stringify(item, null, 2)).join('\n');

    await fs.promises.writeFile(multilingualThinkingPath, multilingualThinkingLines, 'utf8');

    // 写入文件
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
    await fs.promises.writeFile(alpacaPath, JSON.stringify(alpacaData, null, 2));
    await fs.promises.writeFile(sharegptPath, JSON.stringify(sharegptData, null, 2));

    return NextResponse.json({
      success: true,
      configPath,
      files: [
        { path: alpacaPath, format: 'alpaca' },
        { path: sharegptPath, format: 'sharegpt' },
        { path: multilingualThinkingPath, format: 'multilingual-thinking' }
      ]
    });
  } catch (error) {
    console.error('Error generating Llama Factory config:', String(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
