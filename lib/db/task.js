import { db } from '@/lib/db/index';
import { nanoid } from 'nanoid';

// 创建新任务
export async function createTask(taskName, extension, projectId) {
  try {
    let taskId = nanoid(12);
    return await db.task.create({
      data: {
        id: taskId,
        projectId: projectId,
        name: taskName,
        extension: extension
      }
    });
  } catch (error) {
    console.error('Failed to create task in database');
    throw error;
  }
}

// 获取任务
export async function getTaskById(taskId) {
  try {
    return await db.task.findUnique({ where: { id: taskId } });
  } catch (error) {
    console.error('Failed to create task in database');
    throw error;
  }
}

export async function getTasksByProjectId(projectId) {
  try {
    return await db.task.findAll({ where: { projectId: projectId } });
  } catch (error) {
    console.error('Failed to get all task in database');
    throw error;
  }
}

// 更新任务信息
export async function updateTask(taskId, taskData) {
  try {
    delete taskData.taskId;
    return await db.task.update({
      where: { id: taskId },
      data: { ...taskData }
    });
  } catch (error) {
    console.error('Failed to update project in database');
    throw error;
  }
}

// 删除任务
export async function deleteProject(taskId) {
  try {
    await db.task.delete({ where: { id: taskId } });
  } catch (error) {
    console.error('Failed to delete project in database');
    throw error;
  }
}
