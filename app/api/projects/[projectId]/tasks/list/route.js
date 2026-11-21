import { NextResponse } from 'next/server';
import { recoverPendingTasks } from '@/lib/services/tasks/recovery';
import { publicTask } from '@/lib/services/tasks/evaluation-journal';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取项目的所有任务列表
export async function GET(request, { params }) {
  try {
    await recoverPendingTasks();
    const { projectId } = params;
    const { searchParams } = new URL(request.url);

    // 可选参数: 任务类型和任务状态
    const taskType = searchParams.get('taskType');
    const statusStr = searchParams.get('status');

    // 分页参数
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 构建查询条件
    const where = { projectId };

    if (taskType) {
      where.taskType = taskType;
    }

    if (statusStr && !isNaN(parseInt(statusStr))) {
      where.status = parseInt(statusStr);
    }

    // 获取任务总数
    const total = await prisma.task.count({ where });

    // 获取任务列表，按创建时间降序排序，并应用分页
    const tasks = await prisma.task.findMany({
      where,
      orderBy: {
        createAt: 'desc'
      },
      skip: page * limit,
      take: limit
    });

    return NextResponse.json({
      code: 0,
      data: tasks.map(publicTask),
      total,
      page,
      limit,
      message: '任务列表获取成功'
    });
  } catch (error) {
    console.error('获取任务列表失败:', String(error));
    return NextResponse.json(
      {
        code: 500,
        error: '获取任务列表失败',
        message: error.message
      },
      { status: 500 }
    );
  }
}
