import { NextResponse } from 'next/server';
import { getImageDatasetsByProject } from '@/lib/db/imageDatasets';
import { getProjectPath } from '@/lib/db/base';
import fs from 'fs/promises';
import path from 'path';

// 获取图片数据集列表
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page')) || 1;
    const pageSize = parseInt(searchParams.get('pageSize')) || 20;
    const search = searchParams.get('search') || '';
    const confirmed = searchParams.get('confirmed');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');

    // 构建筛选条件
    const filters = {};
    if (search) {
      filters.search = search;
    }
    if (confirmed !== null && confirmed !== undefined) {
      filters.confirmed = confirmed === 'true';
    }
    if (minScore) {
      filters.minScore = parseInt(minScore);
    }
    if (maxScore) {
      filters.maxScore = parseInt(maxScore);
    }

    // When idsOnly=true, skip image loading and return only IDs for navigation
    const idsOnly = searchParams.get('idsOnly') === 'true';

    const result = await getImageDatasetsByProject(projectId, page, pageSize, filters);

    if (idsOnly) {
      return NextResponse.json({
        data: result.data.map(d => ({ id: d.id })),
        total: result.total
      });
    }

    // 获取项目路径
    const projectPath = await getProjectPath(projectId);

    // 为每个数据集添加图片 base64
    const datasetsWithImages = await Promise.all(
      result.data.map(async dataset => {
        try {
          const imagePath = path.join(projectPath, 'images', dataset.imageName);
          const imageBuffer = await fs.readFile(imagePath);
          const base64 = imageBuffer.toString('base64');
          const ext = path.extname(dataset.imageName).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';

          return {
            ...dataset,
            base64: `data:${mimeType};base64,${base64}`
          };
        } catch (error) {
          console.error(`Failed to read image ${dataset.imageName}:`, error);
          return {
            ...dataset,
            base64: null
          };
        }
      })
    );

    return NextResponse.json({
      data: datasetsWithImages,
      total: result.total
    });
  } catch (error) {
    console.error('Failed to get image datasets:', error);
    return NextResponse.json({ error: error.message || 'Failed to get image datasets' }, { status: 500 });
  }
}
