import { NextResponse } from 'next/server';
import { getProject } from '@/lib/db/projects';
import { getDatasets } from '@/lib/db/datasets';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { uploadFiles, createRepo, checkRepoAccess } from '@huggingface/hub';

// 上传数据集到 HuggingFace
export async function POST(request, { params }) {
  try {
    const projectId = params.projectId;
    const {
      token,
      datasetName,
      isPrivate,
      formatType,
      systemPrompt,
      confirmedOnly,
      includeCOT,
      fileFormat,
      customFields,
      reasoningLanguage
    } = await request.json();

    // 获取项目信息
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 获取数据集问题
    const questions = await getDatasets(projectId, confirmedOnly);
    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: '没有可用的数据集问题' }, { status: 400 });
    }

    // 格式化数据集
    const formattedData = formatDataset(questions, formatType, systemPrompt, includeCOT, customFields);

    // 创建临时目录
    const tempDir = path.join(os.tmpdir(), `hf-upload-${projectId}-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // 创建数据集文件
    const datasetFilePath = path.join(tempDir, `dataset.${fileFormat}`);
    if (fileFormat === 'json') {
      fs.writeFileSync(datasetFilePath, JSON.stringify(formattedData, null, 2));
    } else if (fileFormat === 'jsonl') {
      const jsonlContent = formattedData.map(item => JSON.stringify(item)).join('\n');
      fs.writeFileSync(datasetFilePath, jsonlContent);
    } else if (fileFormat === 'csv') {
      const csvContent = convertToCSV(formattedData);
      fs.writeFileSync(datasetFilePath, csvContent);
    }

    // 创建 README.md 文件
    const readmePath = path.join(tempDir, 'README.md');
    const readmeContent = generateReadme(project.name, project.description, formatType);
    fs.writeFileSync(readmePath, readmeContent);

    // 使用 Hugging Face REST API 上传数据集
    const visibility = isPrivate ? 'private' : 'public';

    try {
      // 准备仓库配置
      const repo = { type: 'dataset', name: datasetName };

      // 检查仓库是否存在
      let repoExists = true;
      try {
        await checkRepoAccess({ repo, accessToken: token });
        console.log(`Repository ${datasetName} exists, continuing to upload files`);
      } catch (error) {
        // If error code is 404, the repository does not exist
        if (error.statusCode === 404) {
          repoExists = false;
          console.log(`Repository ${datasetName} does not exist, preparing to create`);
        } else {
          // Other errors (e.g., permission errors)
          throw new Error(`Failed to check repository access: ${error.message}`);
        }
      }

      // If the repository does not exist, create a new one
      if (!repoExists) {
        try {
          await createRepo({
            repo,
            accessToken: token,
            private: isPrivate,
            license: 'mit',
            description: project.description || 'Dataset created with HKGAI Dataset Generation'
          });
          console.log(`Successfully created dataset repository: ${datasetName}`);
        } catch (error) {
          throw new Error(`Failed to create dataset repository: ${error.message}`);
        }
      }

      // 2. 上传数据集文件
      await uploadFile(token, datasetName, datasetFilePath, `dataset.${fileFormat}`);

      // 3. 上传 README.md
      await uploadFile(token, datasetName, readmePath, 'README.md');
    } catch (error) {
      console.error('Upload to HuggingFace Failed:', String(error));
      return NextResponse.json({ error: `Upload Error: ${error.message}` }, { status: 500 });
    }

    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true, force: true });

    // 返回成功信息
    const datasetUrl = `https://huggingface.co/datasets/${datasetName}`;
    return NextResponse.json({
      success: true,
      message: 'Upload successfully HuggingFace',
      url: datasetUrl
    });
  } catch (error) {
    console.error('Upload Faile:', String(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 格式化数据集
function formatDataset(questions, formatType, systemPrompt, includeCOT, customFields) {
  if (formatType === 'alpaca') {
    return questions.map(q => {
      const item = {
        instruction: q.question,
        input: '',
        output: includeCOT && q.cot ? `${q.cot}\n\n${q.answer}` : q.answer
      };

      if (systemPrompt) {
        item.system = systemPrompt;
      }

      return item;
    });
  } else if (formatType === 'sharegpt') {
    return questions.map(q => {
      const messages = [];

      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }

      messages.push({
        role: 'user',
        content: q.question
      });

      messages.push({
        role: 'assistant',
        content: includeCOT && q.cot ? `${q.cot}\n\n${q.answer}` : q.answer
      });

      return { messages };
    });
  } else if (formatType === 'multilingualthinking') {
    return questions.map(q => {
      const messages = [];

      // Main message block
      const mainMsg = {
        reasoning_language: reasoningLanguage ? reasoningLanguage : 'English',
        user: q.question,
        analysis: includeCOT && q.cot ? `${q.cot}` : null,
        final: q.answer
      };
      if (systemPrompt) {
        mainMsg.developer = systemPrompt;
      }
      messages.push(mainMsg);

      // Optional system prompt
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
          thinking: null
        });
      }

      // User message
      messages.push({
        role: 'user',
        content: q.question,
        thinking: null
      });

      // Assistant message
      messages.push({
        role: 'assistant',
        content: q.answer,
        thinking: includeCOT && q.cot ? `${q.cot}` : null
      });

      return { messages };
    });
  } else if (formatType === 'custom' && customFields) {
    return questions.map(q => {
      const item = {
        [customFields.questionField]: q.question,
        [customFields.answerField]: q.answer
      };

      if (includeCOT && q.cot) {
        item[customFields.cotField] = q.cot;
      }

      if (customFields.includeLabels && q.labels) {
        item.labels = q.labels;
      }

      if (customFields.includeChunk && q.chunkId) {
        item.chunkId = q.chunkId;
      }

      return item;
    });
  }

  // 默认返回 alpaca 格式
  return questions.map(q => ({
    instruction: q.question,
    output: includeCOT && q.cot ? `${q.cot}\n\n${q.answer}` : q.answer
  }));
}

// 将数据转换为 CSV 格式
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  const rows = data.map(item => {
    return headers
      .map(header => {
        const value = item[header];
        if (typeof value === 'string') {
          // 处理字符串中的逗号和引号
          return `"${value.replace(/"/g, '""')}"`;
        } else if (Array.isArray(value)) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } else if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(',');
  });

  return [headerRow, ...rows].join('\n');
}

// 使用 @huggingface/hub 包上传文件到 HuggingFace
async function uploadFile(token, datasetName, filePath, destFileName) {
  try {
    // 准备仓库配置
    const repo = { type: 'dataset', name: datasetName };

    // 创建文件 URL
    const fileUrl = new URL(`file://${filePath}`);

    // 使用 @huggingface/hub 包上传文件
    await uploadFiles({
      repo,
      accessToken: token,
      files: [
        {
          path: destFileName,
          content: fileUrl
        }
      ],
      commitTitle: `Upload ${destFileName}`,
      commitDescription: `Files uploaded using HKGAI Dataset Generation`
    });

    return { success: true };
  } catch (error) {
    console.error(`File ${destFileName} Upload Error:`, String(error));
    throw error;
  }
}

// Generate README.md file
function generateReadme(projectName, projectDescription, formatType) {
  return `# ${projectName}

## Description
${projectDescription || 'This dataset was created using the HKGAI Dataset Generation tool.'}

## Format
This dataset is in ${formatType} format.

## Creation Method
This dataset was created using the [HKGAI Dataset Generation](https://github.com/ConardLi/easy-dataset) tool.

> HKGAI Dataset Generation is a specialized application designed to streamline the creation of fine-tuning datasets for Large Language Models (LLMs). It offers an intuitive interface for uploading domain-specific files, intelligently splitting content, generating questions, and producing high-quality training data for model fine-tuning.

`;
}
