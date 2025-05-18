import { createTask, getTaskById, updateTask, getAllTasks } from '@/lib/db/task';
class TaskManager {
  // 创建新任务
  async createTask(taskName, extension, projectId) {
    let task = await createTask(taskName, extension, projectId);
    return task;
  }

  // 启动任务
  async startTask(task, taskFn) {
    // 标记任务为运行中
    task.status = 'running';
    await updateTask(task.id, task);
    // 存储任务引用以便后续管理
    this._executeTask(task.id, taskFn);
  }

  // 实际执行任务
  async _executeTask(taskId, taskFn) {
    const task = await getTaskById(taskId);
    try {
      // 执行任务函数
      await taskFn(async (progress, message) => {
        task.progress = Math.min(100, Math.max(0, progress));
        task.message = JSON.stringify(message);
        task.updatedAt = new Date();
        await updateTask(taskId, task);
      });
      // 标记任务为完成
      console.log('任务执行完成');
      task.status = 'completed';
      task.updatedAt = new Date();
      await updateTask(taskId, task);
    } catch (error) {
      // 标记任务为失败
      task.status = 'failed';
      task.error = error.message;
      updateTask(taskId, task);
      throw error;
    }
  }

  // 获取任务状态
  async getTask(taskId) {
    const task = await getTaskById(taskId);
    return task;
  }

  async getAllTasks(projectId) {
    return await getAllTasks(projectId);
  }
}

// 单例模式导出
const taskManager = new TaskManager();

module.exports = taskManager;
