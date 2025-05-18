import { NextResponse } from 'next/server';
import { getQuestionsForTree, getQuestionsByTag } from '@/lib/db/questions';

/**
 * 获取项目的问题树形视图数据
 * @param {Request} request - 请求对象
 * @param {Object} params - 路由参数
 * @returns {Promise<Response>} - 包含问题数据的响应
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const input = searchParams.get('input');
    const tagsOnly = searchParams.get('tagsOnly') === 'true';
    const isDistill = searchParams.get('isDistill') === 'true';

    if (tag) {
      // 获取指定标签的问题数据（包含完整字段）
      const questions = await getQuestionsByTag(projectId, tag, input, isDistill);
      return NextResponse.json(questions);
    } else if (tagsOnly) {
      // 只获取标签信息（仅包含 id 和 label 字段）
      const treeData = await getQuestionsForTree(projectId, input, isDistill);
      return NextResponse.json(treeData);
    } else {
      // 兼容原有请求，获取树形视图数据（仅包含 id 和 label 字段）
      const treeData = await getQuestionsForTree(projectId, null, isDistill);
      return NextResponse.json(treeData);
    }
  } catch (error) {
    console.error('获取问题树形数据失败:', error);
    return NextResponse.json({ error: error.message || '获取问题树形数据失败' }, { status: 500 });
  }
}
