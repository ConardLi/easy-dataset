import { NextResponse } from 'next/server';
import {
  getDatasets,
  getBalancedDatasetsByTags,
  getTagsWithDatasetCounts,
  getDatasetsBatch,
  getBalancedDatasetsByTagsBatch,
  getDatasetsByIds,
  getDatasetsByIdsBatch
} from '@/lib/db/datasets';

/**
 * 获取导出数据集
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID cannot be empty' }, { status: 400 });
    }

    const confirmedParam = searchParams.get('confirmed');
    const confirmed = confirmedParam === null ? undefined : confirmedParam === 'true';

    // 获取标签统计信息
    const tagStats = await getTagsWithDatasetCounts(projectId, confirmed);
    return NextResponse.json(tagStats);
  } catch (error) {
    console.error('Failed to get tag statistics:', String(error));
    return NextResponse.json(
      {
        error: error.message || 'Failed to get tag statistics'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取标签统计信息
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const body = await request.json();

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID cannot be empty' }, { status: 400 });
    }

    let status = body.status;
    let confirmed = undefined;
    if (status === 'confirmed') confirmed = true;
    if (status === 'unconfirmed') confirmed = false;

    // 检查是否是分批导出模式
    const batchMode = body.batchMode ? 'true' : 'false';
    const offset = body.offset ?? 0;
    const batchSize = body.batchSize ?? 1000;

    // 检查是否是平衡导出
    const balanceMode = body.balanceMode ? 'true' : 'false';
    const balanceConfig = body.balanceConfig;

    // 检查是否有选中的数据集 ID
    const selectedIds = Array.isArray(body.selectedIds) ? body.selectedIds : null;

    if (batchMode === 'true') {
      // 分批导出模式
      if (selectedIds && selectedIds.length > 0) {
        // 按选中 ID 分批导出
        const datasets = await getDatasetsByIdsBatch(projectId, selectedIds, offset, batchSize);
        const hasMore = datasets.length === batchSize;
        return NextResponse.json({
          data: datasets,
          hasMore,
          offset: offset + datasets.length
        });
      } else if (balanceMode === 'true' && balanceConfig) {
        // 平衡分批导出
        const parsedConfig = typeof balanceConfig === 'string' ? JSON.parse(balanceConfig) : balanceConfig;
        const result = await getBalancedDatasetsByTagsBatch(projectId, parsedConfig, confirmed, offset, batchSize);
        return NextResponse.json({
          data: result.data,
          hasMore: result.hasMore,
          offset: offset + result.data.length
        });
      } else {
        // 常规分批导出
        const datasets = await getDatasetsBatch(projectId, confirmed, offset, batchSize);
        const hasMore = datasets.length === batchSize;
        return NextResponse.json({
          data: datasets,
          hasMore,
          offset: offset + datasets.length
        });
      }
    } else {
      // 传统一次性导出模式（保持向后兼容）
      if (selectedIds && selectedIds.length > 0) {
        // 按选中 ID 导出
        const datasets = await getDatasetsByIds(projectId, selectedIds);
        return NextResponse.json(datasets);
      } else if (balanceMode === 'true' && balanceConfig) {
        // 平衡导出模式
        const parsedConfig = typeof balanceConfig === 'string' ? JSON.parse(balanceConfig) : balanceConfig;
        const datasets = await getBalancedDatasetsByTags(projectId, parsedConfig, confirmed);
        return NextResponse.json(datasets);
      } else {
        // 常规导出模式
        const datasets = await getDatasets(projectId, confirmed);
        return NextResponse.json(datasets);
      }
    }
  } catch (error) {
    console.error('Failed to get datasets:', String(error));
    return NextResponse.json(
      {
        error: error.message || 'Failed to get datasets'
      },
      { status: 500 }
    );
  }
}
