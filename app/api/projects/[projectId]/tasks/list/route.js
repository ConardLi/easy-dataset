import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processTask } from '@/lib/services/tasks';

const prisma = new PrismaClient();

// 获取项目的所有任务列表
export async function GET(request, { params }) {
  try {
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
      data: tasks,
      total,
      page,
      limit,
      message: '任务列表获取成功'
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
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

// 创建新任务
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const data = await request.json();

    // 验证必填字段
    const { taskType, modelInfo, language, detail = '', totalCount = 0, note } = data;

    if (!taskType) {
      return NextResponse.json(
        {
          code: 400,
          error: '缺少必要参数: taskType'
        },
        { status: 400 }
      );
    }

    // 创建新任务
    const newTask = await prisma.task.create({
      data: {
        projectId,
        taskType,
        status: 0, // 初始状态: 处理中
        modelInfo: typeof modelInfo === 'string' ? modelInfo : JSON.stringify(modelInfo),
        language: language || 'zh-CN',
        detail: detail || '',
        totalCount,
        note: note ? JSON.stringify(note) : "",
        completedCount: 0
      }
    });

    // 异步启动任务处理
    processTask(newTask.id).catch(err => {
      console.error(`任务启动失败: ${newTask.id}`, err);
    });

    return NextResponse.json({
      code: 0,
      data: newTask,
      message: '任务创建成功'
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    return NextResponse.json(
      {
        code: 500,
        error: '创建任务失败',
        message: error.message
      },
      { status: 500 }
    );
  }
}
