import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getProjectRoot } from '@/lib/db/base';
import { getDatasets } from '@/lib/db/datasets';

export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { formatType, systemPrompt, confirmedOnly, includeCOT } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const configPath = path.join(projectPath, 'dataset_info.json');
    const alpacaPath = path.join(projectPath, 'alpaca.json');
    const sharegptPath = path.join(projectPath, 'sharegpt.json');

    // 获取数据集
    let datasets = await getDatasets(projectId);

    // 如果只导出已确认的数据集
    if (confirmedOnly) {
      datasets = datasets.filter(dataset => dataset.confirmed);
    }

    // 创建 dataset_info.json 配置
    const config = {
      [`[Easy Dataset] [${projectId}] Alpaca`]: {
        file_name: 'alpaca.json',
        columns: {
          prompt: 'instruction',
          query: 'input',
          response: 'output',
          system: 'system'
        }
      },
      [`[Easy Dataset] [${projectId}] ShareGPT`]: {
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

    // 写入文件
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
    await fs.promises.writeFile(alpacaPath, JSON.stringify(alpacaData, null, 2));
    await fs.promises.writeFile(sharegptPath, JSON.stringify(sharegptData, null, 2));

    return NextResponse.json({
      success: true,
      configPath,
      files: [
        { path: alpacaPath, format: 'alpaca' },
        { path: sharegptPath, format: 'sharegpt' }
      ]
    });
  } catch (error) {
    console.error('Error generating Llama Factory config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
