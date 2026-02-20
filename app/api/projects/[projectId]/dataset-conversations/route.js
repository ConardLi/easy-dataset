/**
 * 多轮对话数据集管理API
 */

import { NextResponse } from 'next/server';
import {
  getDatasetConversationsByPagination,
  getAllDatasetConversationIds,
  createDatasetConversation
} from '@/lib/db/dataset-conversations';
import { generateMultiTurnConversation } from '@/lib/services/multi-turn/index';

/**
 * 获取多轮对话数据集列表（支持分页和筛选）
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);

    const getAllIds = searchParams.get('getAllIds') === 'true'; // 新增：获取所有对话ID的标志

    // 筛选条件
    const filters = {
      keyword: searchParams.get('keyword'),
      roleA: searchParams.get('roleA'),
      roleB: searchParams.get('roleB'),
      scenario: searchParams.get('scenario'),
      scoreMin: searchParams.get('scoreMin'),
      scoreMax: searchParams.get('scoreMax'),
      confirmed: searchParams.get('confirmed')
    };

    // 清除空值
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    // 如果请求获取所有ID
    if (getAllIds) {
      const allConversationIds = await getAllDatasetConversationIds(projectId, filters);
      return NextResponse.json({ allConversationIds });
    }

    // 正常分页查询
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await getDatasetConversationsByPagination(projectId, page, pageSize, filters);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取多轮对话数据集失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * 创建多轮对话数据集
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const body = await request.json();

    const { questionId, systemPrompt, scenario, rounds, roleA, roleB, model, language = '中文' } = body;

    if (!questionId) {
      return NextResponse.json(
        {
          success: false,
          message: '问题ID不能为空'
        },
        { status: 400 }
      );
    }

    if (!model || !model.modelId) {
      return NextResponse.json(
        {
          success: false,
          message: '模型配置不能为空'
        },
        { status: 400 }
      );
    }

    // 构建配置
    const config = {
      systemPrompt: systemPrompt || '',
      scenario: scenario || '',
      rounds: rounds || 3,
      roleA: roleA || '用户',
      roleB: roleB || '助手',
      model,
      language
    };

    // 生成多轮对话
    const result = await generateMultiTurnConversation(projectId, questionId, config);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('创建多轮对话数据集失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}
