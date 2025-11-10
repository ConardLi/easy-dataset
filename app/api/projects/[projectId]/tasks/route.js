import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getProjectRoot } from '@/lib/db/base';
import { getTaskConfig } from '@/lib/db/projects';
import { processTask } from '@/lib/services/tasks';
import { db } from '@/lib/db/index';

// 获取任务配置
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目 ID
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);

    // 检查项目是否存在
    try {
      await fs.access(projectPath);
    } catch (error) {
      return NextResponse.json({ error: 'Project does not exist' + projectPath }, { status: 404 });
    }

    const taskConfig = await getTaskConfig(projectId);
    return NextResponse.json(taskConfig);
  } catch (error) {
    console.error('Failed to obtain task configuration:', String(error));
    return NextResponse.json({ error: 'Failed to obtain task configuration' }, { status: 500 });
  }
}

// 更新任务配置
export async function PUT(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目 ID
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // 获取请求体
    const taskConfig = await request.json();

    // 验证请求体
    if (!taskConfig) {
      return NextResponse.json({ error: 'Task configuration cannot be empty' }, { status: 400 });
    }

    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);

    // 检查项目是否存在
    try {
      await fs.access(projectPath);
    } catch (error) {
      return NextResponse.json({ error: 'Project does not exist' }, { status: 404 });
    }

    // 获取任务配置文件路径
    const taskConfigPath = path.join(projectPath, 'task-config.json');

    // 写入任务配置文件
    await fs.writeFile(taskConfigPath, JSON.stringify(taskConfig, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Task configuration updated successfully' });
  } catch (error) {
    console.error('Failed to update task configuration:', String(error));
    return NextResponse.json({ error: 'Failed to update task configuration' }, { status: 500 });
  }
}

// 创建新任务
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const data = await request.json();

    // 验证必填字段
    const { taskType, modelInfo, language, detail = '', totalCount = 0, note } = data;

    if (!taskType) {
      return NextResponse.json(
        {
          code: 400,
          error: 'Missing required parameter: taskType'
        },
        { status: 400 }
      );
    }

    // 创建新任务
    // 处理 modelInfo，如果太长则截断或只保存关键信息
    let processedModelInfo = typeof modelInfo === 'string' ? modelInfo : JSON.stringify(modelInfo);
    // SQLite TEXT 字段最大约 1GB，但为了性能考虑，限制为 100KB
    const maxModelInfoLength = 100000;
    if (processedModelInfo.length > maxModelInfoLength) {
      console.warn(`modelInfo too long (${processedModelInfo.length} chars), truncating to ${maxModelInfoLength}`);
      // 如果是 JSON 字符串，尝试只保留关键字段
      try {
        const modelInfoObj = JSON.parse(processedModelInfo);
        const simplified = {
          providerId: modelInfoObj.providerId,
          modelName: modelInfoObj.modelName,
          modelId: modelInfoObj.modelId,
          endpoint: modelInfoObj.endpoint ? modelInfoObj.endpoint.substring(0, 200) : undefined
        };
        processedModelInfo = JSON.stringify(simplified);
      } catch (e) {
        // 如果不是 JSON，直接截断
        processedModelInfo = processedModelInfo.substring(0, maxModelInfoLength);
      }
    }
    
    // 处理 note，避免过长
    let processedNote = '';
    if (note !== undefined && note !== null) {
      if (typeof note === 'string') {
        processedNote = note;
      } else {
        const simplified = { ...note };
        if (note?.vsionModel) {
          simplified.vsionModel = {
            id: note.vsionModel.id,
            modelId: note.vsionModel.modelId,
            modelName: note.vsionModel.modelName,
            providerId: note.vsionModel.providerId,
            providerName: note.vsionModel.projectName || note.vsionModel.providerName
          };
        }
        if (Array.isArray(note?.fileList)) {
          simplified.fileList = note.fileList.map(file => ({
            id: file.id || file.fileId || file.file_id,
            fileId: file.fileId || file.id,
            fileName: file.fileName || file.name,
            size: file.size,
            pageCount: file.pageCount
          }));
        }
        processedNote = JSON.stringify(simplified);
      }

      const maxNoteLength = 100000;
      if (processedNote.length > maxNoteLength) {
        console.warn(`note too long (${processedNote.length} chars), truncating to ${maxNoteLength}`);
        processedNote = processedNote.substring(0, maxNoteLength);
      }
    }

    const newTask = await db.task.create({
      data: {
        projectId,
        taskType,
        status: 0, // 初始状态: 处理中
        modelInfo: processedModelInfo,
        language: language || 'zh-CN',
        detail: detail || '',
        totalCount,
        note: processedNote,
        completedCount: 0
      }
    });

    // 异步启动任务处理
    processTask(newTask.id).catch(err => {
      console.error(`Task startup failed: ${newTask.id}`, String(err));
    });

    return NextResponse.json({
      code: 0,
      data: newTask,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Failed to create task:', String(error));
    return NextResponse.json(
      {
        code: 500,
        error: 'Failed to create task',
        message: error.message
      },
      { status: 500 }
    );
  }
}
