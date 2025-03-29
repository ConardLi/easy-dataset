import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getProjectRoot } from '@/lib/db/base';
import { getTaskConfig } from '@/lib/db/projects';

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
      return NextResponse.json({ error: 'Project does not exist' }, { status: 404 });
    }

    const taskConfig = await getTaskConfig(projectId);
    return NextResponse.json(taskConfig);
  } catch (error) {
    console.error('Failed to obtain task configuration:', error);
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
    console.error('Failed to update task configuration:', error);
    return NextResponse.json({ error: 'Failed to update task configuration' }, { status: 500 });
  }
}
