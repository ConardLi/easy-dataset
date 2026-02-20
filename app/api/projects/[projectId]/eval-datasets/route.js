import { NextResponse } from 'next/server';
import { getEvalQuestionsWithPagination, getEvalQuestionsStats, deleteEvalQuestion } from '@/lib/db/evalDatasets';

/**
 * Get project's evaluation dataset list (paginated)
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);

    // Parse query params
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const questionType = searchParams.get('questionType') || '';
    const questionTypes = searchParams.getAll('questionTypes');
    const keyword = searchParams.get('keyword') || '';
    const chunkId = searchParams.get('chunkId') || '';
    // Support multiple tags params or comma-separated tag
    const tags =
      searchParams.getAll('tags').length > 0
        ? searchParams.getAll('tags')
        : searchParams.get('tag')
          ? searchParams.get('tag').split(',')
          : [];

    const includeStats = searchParams.get('includeStats') === 'true';

    const queryOptions = {
      page,
      pageSize,
      questionType: questionType || undefined,
      questionTypes: questionTypes.length > 0 ? questionTypes : undefined,
      keyword: keyword || undefined,
      chunkId: chunkId || undefined,
      tags: tags.length > 0 ? tags : undefined
    };

    if (includeStats) {
      const [result, stats] = await Promise.all([
        getEvalQuestionsWithPagination(projectId, queryOptions),
        getEvalQuestionsStats(projectId)
      ]);
      result.stats = stats;
      return NextResponse.json(result);
    }

    const result = await getEvalQuestionsWithPagination(projectId, queryOptions);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get eval datasets:', error);
    return NextResponse.json({ error: error.message || 'Failed to get eval datasets' }, { status: 500 });
  }
}

/**
 * Batch delete evaluation datasets
 */
export async function DELETE(request, { params }) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid request: ids array is required' }, { status: 400 });
    }

    const results = await Promise.all(ids.map(id => deleteEvalQuestion(id).catch(err => ({ error: err.message, id }))));
    const deleted = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;

    return NextResponse.json({
      success: true,
      deleted,
      failed,
      message: `Successfully deleted ${deleted} items${failed > 0 ? `, ${failed} failed` : ''}`
    });
  } catch (error) {
    console.error('Failed to delete eval datasets:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete eval datasets' }, { status: 500 });
  }
}

/**
 * Create a new evaluation dataset (or batch create)
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const body = await request.json();

    const { createEvalQuestion, createManyEvalQuestions } = require('@/lib/db/evalDatasets');

    // Handle batch creation
    if (Array.isArray(body) || (body.items && Array.isArray(body.items))) {
      const items = Array.isArray(body) ? body : body.items;

      if (items.length === 0) {
        return NextResponse.json({ success: true, count: 0 });
      }

      // Validate items
      const validItems = items
        .map(item => {
          // 确保标签格式正确: 数组转为逗号分隔字符串
          let tagsStr = item.tags || '';
          if (Array.isArray(tagsStr)) {
            tagsStr = tagsStr.join(',');
          }
          return {
            projectId,
            question: item.question,
            questionType: item.questionType || 'open_ended',
            correctAnswer:
              typeof item.correctAnswer === 'object' ? JSON.stringify(item.correctAnswer) : item.correctAnswer,
            tags: tagsStr,
            note: item.note || '',
            chunkId: item.chunkId || null,
            options: item.options
              ? typeof item.options === 'object'
                ? JSON.stringify(item.options)
                : item.options
              : ''
          };
        })
        .filter(item => item.question && item.correctAnswer);

      if (validItems.length === 0) {
        return NextResponse.json({ error: 'No valid items to create' }, { status: 400 });
      }

      const result = await createManyEvalQuestions(validItems);
      return NextResponse.json({ success: true, count: result.count });
    }

    // Handle single creation
    const { question, correctAnswer, questionType = 'open_ended', tags, note, chunkId, options } = body;

    if (!question || !correctAnswer) {
      return NextResponse.json({ error: 'Question and Correct Answer are required' }, { status: 400 });
    }

    // 确保标签格式正确: 数组转为逗号分隔字符串
    let tagsStr = tags || '';
    if (Array.isArray(tagsStr)) {
      tagsStr = tagsStr.join(',');
    }

    const evalDataset = await createEvalQuestion({
      projectId,
      question,
      questionType,
      correctAnswer: typeof correctAnswer === 'object' ? JSON.stringify(correctAnswer) : correctAnswer,
      tags: tagsStr,
      note: note || '',
      chunkId: chunkId || null,
      options: options ? (typeof options === 'object' ? JSON.stringify(options) : options) : ''
    });

    return NextResponse.json({ success: true, evalDataset });
  } catch (error) {
    console.error('Failed to create eval dataset:', error);
    return NextResponse.json({ error: error.message || 'Failed to create eval dataset' }, { status: 500 });
  }
}
