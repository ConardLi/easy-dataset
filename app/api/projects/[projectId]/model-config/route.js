import { NextResponse } from 'next/server';
import { getModelConfigByProjectId, saveModelConfig } from '@/lib/db/model-config';

// 获取模型配置列表
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    // 验证项目 ID
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }
    let modelConfigList = await getModelConfigByProjectId(projectId);
    return NextResponse.json(modelConfigList);
  } catch (error) {
    console.error('Error obtaining model configuration:', error);
    return NextResponse.json({ error: 'Failed to obtain model configuration' }, { status: 500 });
  }
}

// 保存模型配置
export async function POST(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目 ID
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }
    // 获取请求体
    const modelConfig = await request.json();

    // 验证请求体
    if (!modelConfig) {
      return NextResponse.json({ error: 'The model configuration cannot be empty ' }, { status: 400 });
    }
    modelConfig.projectId = projectId;
    const res = await saveModelConfig(modelConfig);

    return NextResponse.json(res);
  } catch (error) {
    console.error('Error updating model configuration:', error);
    return NextResponse.json({ error: 'Failed to update model configuration' }, { status: 500 });
  }
}
