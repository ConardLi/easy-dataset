import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getProjectRoot } from '@/lib/db/base';

// 获取模型配置
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目 ID
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);

    // 检查项目是否存在
    try {
      await fs.access(projectPath);
    } catch (error) {
      return NextResponse.json({ error: 'The project does not exist' }, { status: 404 });
    }

    // 获取模型配置文件路径
    const modelConfigPath = path.join(projectPath, 'model-config.json');

    // 检查模型配置文件是否存在
    try {
      await fs.access(modelConfigPath);
    } catch (error) {
      // 如果配置文件不存在，返回默认配置
      return NextResponse.json([]);
    }

    // 读取模型配置文件
    const modelConfigData = await fs.readFile(modelConfigPath, 'utf-8');
    const modelConfig = JSON.parse(modelConfigData);

    return NextResponse.json(modelConfig);
  } catch (error) {
    console.error('Error obtaining model configuration:', error);
    return NextResponse.json({ error: 'Failed to obtain model configuration' }, { status: 500 });
  }
}

// 更新模型配置
export async function PUT(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目 ID
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    // 获取请求体
    const modelConfig = await request.json();

    // 验证请求体
    if (!modelConfig || !Array.isArray(modelConfig)) {
      return NextResponse.json({ error: 'The model configuration must be an array' }, { status: 400 });
    }

    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);

    // 检查项目是否存在
    try {
      await fs.access(projectPath);
    } catch (error) {
      return NextResponse.json({ error: 'The project does not exist' }, { status: 404 });
    }

    // 获取模型配置文件路径
    const modelConfigPath = path.join(projectPath, 'model-config.json');

    // 写入模型配置文件
    await fs.writeFile(modelConfigPath, JSON.stringify(modelConfig, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Model configuration updated successfully' });
  } catch (error) {
    console.error('Error updating model configuration:', error);
    return NextResponse.json({ error: 'Failed to update model configuration' }, { status: 500 });
  }
}
