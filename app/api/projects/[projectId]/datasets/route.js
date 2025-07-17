import { NextResponse } from 'next/server';
import {
  deleteDataset,
  getDatasetsByPagination,
  getDatasetsIds,
  getDatasetsById,
  updateDataset
} from '@/lib/db/datasets';
import datasetService from '@/lib/services/datasets';

// 优化思维链函数已移至服务层

/**
 * 生成数据集（为单个问题生成答案）
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { questionId, model, language } = await request.json();

    // 使用数据集生成服务
    const result = await datasetService.generateDatasetForQuestion(projectId, questionId, {
      model,
      language
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to generate dataset:', String(error));
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate dataset'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取项目的所有数据集
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }
    let status = searchParams.get('status');
    let confirmed = undefined;
    if (status === 'confirmed') confirmed = true;
    if (status === 'unconfirmed') confirmed = false;

    let selectedAll = searchParams.get('selectedAll');
    // 获取搜索字段参数
    const field = searchParams.get('field') || 'question';
    // 获取思维链筛选参数
    const hasCot = searchParams.get('hasCot') || 'all';
    const validation = searchParams.get('validation') || 'all';
    if (selectedAll) {
      let data = await getDatasetsIds(projectId, confirmed, searchParams.get('input'), field, hasCot, validation);
      return NextResponse.json(data);
    }

    // 获取数据集
    const datasets = await getDatasetsByPagination(
      projectId,
      parseInt(searchParams.get('page')),
      parseInt(searchParams.get('size')),
      confirmed,
      searchParams.get('input'),
      field,
      hasCot,
      validation
    );

    return NextResponse.json(datasets);
  } catch (error) {
    console.error('获取数据集失败:', String(error));
    return NextResponse.json(
      {
        error: error.message || '获取数据集失败'
      },
      { status: 500 }
    );
  }
}

/**
 * 删除数据集
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('id');
    if (!datasetId) {
      return NextResponse.json(
        {
          error: 'Dataset ID cannot be empty'
        },
        { status: 400 }
      );
    }

    await deleteDataset(datasetId);

    return NextResponse.json({
      success: true,
      message: 'Dataset deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete dataset:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete dataset'
      },
      { status: 500 }
    );
  }
}

/**
 * 编辑数据集
 */
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('id');
    const { answer, cot, confirmed } = await request.json();
    if (!datasetId) {
      return NextResponse.json(
        {
          error: 'Dataset ID cannot be empty'
        },
        { status: 400 }
      );
    }
    // 获取所有数据集
    let dataset = await getDatasetsById(datasetId);
    if (!dataset) {
      return NextResponse.json(
        {
          error: 'Dataset does not exist'
        },
        { status: 404 }
      );
    }
    let data = { id: datasetId };
    if (confirmed) data.confirmed = confirmed;
    if (answer) data.answer = answer;
    if (cot) data.cot = cot;

    // 保存更新后的数据集列表
    await updateDataset(data);

    return NextResponse.json({
      success: true,
      message: 'Dataset updated successfully',
      dataset: dataset
    });
  } catch (error) {
    console.error('Failed to update dataset:', String(error));
    return NextResponse.json(
      {
        error: error.message || 'Failed to update dataset'
      },
      { status: 500 }
    );
  }
}
