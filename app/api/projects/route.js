import { createProject, getProjects, isExistByName, getProject } from '@/lib/db/projects';
import { createInitModelConfig, getModelConfigByProjectId } from '@/lib/db/model-config';
import { getCurrentUserId, checkIsAdmin, canAccessProject } from '@/lib/auth';

export async function POST(request) {
  try {
    const projectData = await request.json();
    // 验证必要的字段
    if (!projectData.name) {
      return Response.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    // 获取当前用户
    const userId = await getCurrentUserId();
    const isAdmin = await checkIsAdmin();

    // 验证项目名称是否已存在（在同一用户下）
    if (await isExistByName(projectData.name, userId, isAdmin)) {
      return Response.json({ error: '项目名称已存在' }, { status: 400 });
    }
    
    // 创建项目
    const newProject = await createProject(projectData, userId);
    
    // 如果指定了要复用的项目配置，需要检查权限
    if (projectData.reuseConfigFrom) {
      const sourceProject = await getProject(projectData.reuseConfigFrom);
      if (!sourceProject) {
        return Response.json({ error: '源项目不存在' }, { status: 404 });
      }
      
      // 检查是否有权限访问源项目
      if (!(await canAccessProject(sourceProject.userId))) {
        return Response.json({ error: '无权访问源项目' }, { status: 403 });
      }
      
      let data = await getModelConfigByProjectId(projectData.reuseConfigFrom);
      let newData = data.map(item => {
        delete item.id;
        return {
          ...item,
          projectId: newProject.id
        };
      });
      await createInitModelConfig(newData);
    }
    return Response.json(newProject, { status: 201 });
  } catch (error) {
    console.error('创建项目出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // 获取当前用户信息
    const userId = await getCurrentUserId();
    const isAdmin = await checkIsAdmin();
    
    // 根据用户权限获取项目列表
    const projects = await getProjects(userId, isAdmin);
    return Response.json(projects);
  } catch (error) {
    console.error('获取项目列表出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
