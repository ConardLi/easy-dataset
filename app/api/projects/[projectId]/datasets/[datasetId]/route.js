import { NextResponse } from 'next/server';
import { getDatasetsById, getDatasetsCounts, getNavigationItems, updateDatasetMetadata } from '@/lib/db/datasets';

/**
 * 获取项目的所有数据集
 */
export async function GET(request, { params }) {
  try {
    const { projectId, datasetId } = params;
    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }
    if (!datasetId) {
      return NextResponse.json({ error: '数据集ID不能为空' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const operateType = searchParams.get('operateType');
    if (operateType !== null) {
      const status = searchParams.get('status');
      let confirmed = undefined;
      if (status === 'confirmed') confirmed = true;
      if (status === 'unconfirmed') confirmed = false;
      const filters = {
        confirmed,
        input: searchParams.get('input') || '',
        field: searchParams.get('field') || 'question',
        hasCot: searchParams.get('hasCot') || 'all',
        isDistill: searchParams.get('isDistill') || 'all',
        scoreRange: searchParams.get('scoreRange') || '',
        customTag: searchParams.get('customTag') || '',
        noteKeyword: searchParams.get('noteKeyword') || '',
        chunkName: searchParams.get('chunkName') || ''
      };
      const data = await getNavigationItems(projectId, datasetId, operateType, filters);
      return NextResponse.json(data);
    }
    const datasets = await getDatasetsById(datasetId);
    let counts = await getDatasetsCounts(projectId);

    return NextResponse.json({ datasets, ...counts });
  } catch (error) {
    console.error('获取数据集详情失败:', String(error));
    return NextResponse.json(
      {
        error: error.message || '获取数据集详情失败'
      },
      { status: 500 }
    );
  }
}

/**
 * 更新数据集元数据（评分、标签、备注）
 */
export async function PATCH(request, { params }) {
  try {
    const { projectId, datasetId } = params;

    // 验证参数
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }
    if (!datasetId) {
      return NextResponse.json({ error: '数据集ID不能为空' }, { status: 400 });
    }

    const body = await request.json();
    const { score, tags, note } = body;

    // 验证评分范围
    if (score !== undefined && (score < 0 || score > 5)) {
      return NextResponse.json({ error: '评分必须在0-5之间' }, { status: 400 });
    }

    // 验证标签格式
    if (tags !== undefined && !Array.isArray(tags)) {
      return NextResponse.json({ error: '标签必须是数组格式' }, { status: 400 });
    }

    // 更新数据集元数据
    const updatedDataset = await updateDatasetMetadata(datasetId, { score, tags, note });

    return NextResponse.json({
      success: true,
      dataset: updatedDataset
    });
  } catch (error) {
    console.error('更新数据集元数据失败:', String(error));
    return NextResponse.json(
      {
        error: error.message || '更新数据集元数据失败'
      },
      { status: 500 }
    );
  }
}
