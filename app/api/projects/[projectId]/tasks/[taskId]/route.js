import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// 获取任务详情
export async function GET(request, { params }) {
  try {
    const { projectId, taskId } = params;

    // 验证必填参数
    if (!projectId || !taskId) {
      return NextResponse.json(
        {
          code: 400,
          error: '缺少必要参数'
        },
        { status: 400 }
      );
    }

    // 查询任务详情
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        projectId
      }
    });

    if (!task) {
      return NextResponse.json(
        {
          code: 404,
          error: '任务不存在'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      data: task,
      message: '获取任务详情成功'
    });
  } catch (error) {
    console.error('获取任务详情失败:', String(error));
    return NextResponse.json(
      {
        code: 500,
        error: '获取任务详情失败',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// 更新任务状态
export async function PATCH(request, { params }) {
  try {
    const { projectId, taskId } = params;
    const data = await request.json();

    // 验证必填参数
    if (!projectId || !taskId) {
      return NextResponse.json(
        {
          code: 400,
          error: '缺少必要参数'
        },
        { status: 400 }
      );
    }

    // 获取要更新的字段
    const { status, completedCount, totalCount, detail, note, endTime } = data;

    // 构建更新数据
    const updateData = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (completedCount !== undefined) {
      updateData.completedCount = completedCount;
    }

    if (totalCount !== undefined) {
      updateData.totalCount = totalCount;
    }

    if (detail !== undefined) {
      updateData.detail = detail;
    }

    if (note !== undefined) {
      updateData.note = note;
    }

    // 如果状态变为已完成、失败或已中断，自动添加结束时间
    if (status === 1 || status === 2 || status === 3) {
      updateData.endTime = endTime || new Date();
    }

    // 更新任务
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId
      },
      data: updateData
    });

    return NextResponse.json({
      code: 0,
      data: updatedTask,
      message: '更新任务状态成功'
    });
  } catch (error) {
    console.error('更新任务状态失败:', String(error));

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        {
          code: 404,
          error: '任务不存在',
          message: '请求的任务不存在或已被删除'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        code: 500,
        error: '更新任务状态失败',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// 删除任务
export async function DELETE(request, { params }) {
  try {
    const { projectId, taskId } = params;

    // 验证必填参数
    if (!projectId || !taskId) {
      return NextResponse.json(
        {
          code: 400,
          error: '缺少必要参数'
        },
        { status: 400 }
      );
    }

    // 删除任务
    await prisma.task.delete({
      where: {
        id: taskId,
        projectId
      }
    });

    return NextResponse.json({
      code: 0,
      message: '删除任务成功'
    });
  } catch (error) {
    console.error('删除任务失败:', String(error));
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        {
          code: 404,
          error: '任务不存在',
          message: '请求的任务不存在或已被删除'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        code: 500,
        error: '删除任务失败',
        message: error.message
      },
      { status: 500 }
    );
  }
}
