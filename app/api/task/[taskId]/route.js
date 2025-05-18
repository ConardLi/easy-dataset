import taskManager from '@/lib/task/taskManager';

/**
 * 通用任务处理，对于一些不需要特殊处理的任务，直接使用此接口获取任务详情
 * @param {*} request
 * @param {*} param1
 * @returns
 */
export async function GET(request, { params }) {
  try {
    const { taskId } = params;
    const task = await taskManager.getTask(taskId);
    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }
    return Response.json(task);
  } catch (error) {
    console.error('获取任务详情出错:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
