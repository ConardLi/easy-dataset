import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const body = await request.json();
    const { format, selectedIds, filters } = body;

    let questions;

    // 如果有选中的问题 ID，按 ID 获取
    if (selectedIds && selectedIds.length > 0) {
      questions = await getQuestionsByIds(projectId, selectedIds);
    } else {
      // 否则获取全部问题（不限分页）
      questions = await getAllQuestions(
        projectId,
        filters?.searchTerm || '',
        filters?.chunkName || '',
        filters?.sourceType || 'all'
      );
    }

    // 固定导出字段：问题内容、文本块名称、问题标签
    const filteredQuestions = questions.map(q => ({
      question: q.question,
      chunkName: q.chunk?.name || q.chunkName || '',
      questionLabel: q.label || ''
    }));

    return NextResponse.json(filteredQuestions);
  } catch (error) {
    console.error('Failed to export questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 获取全部问题（不限分页）
async function getAllQuestions(projectId, searchTerm = '', chunkName = '', sourceType = 'all') {
  const { db } = await import('@/lib/db/index');

  const whereClause = {
    projectId
  };

  // 搜索条件
  if (searchTerm) {
    whereClause.OR = [{ question: { contains: searchTerm } }, { label: { contains: searchTerm } }];
  }

  // 文本块名称筛选
  if (chunkName) {
    whereClause.chunk = {
      name: { contains: chunkName }
    };
  }

  // 数据源类型筛选
  if (sourceType === 'text') {
    whereClause.imageName = null;
  } else if (sourceType === 'image') {
    whereClause.imageName = { not: null };
  }

  return await db.questions.findMany({
    where: whereClause,
    include: {
      chunk: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createAt: 'desc'
    }
  });
}

// 根据 ID 列表获取问题
async function getQuestionsByIds(projectId, questionIds) {
  const { db } = await import('@/lib/db/index');

  return await db.questions.findMany({
    where: {
      projectId,
      id: { in: questionIds }
    },
    include: {
      chunk: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createAt: 'desc'
    }
  });
}
