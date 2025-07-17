import { createProject, getProjects, isExistByName } from '@/lib/db/projects';

export async function POST(request) {
  try {
    const projectData = await request.json();
    // 验证必要的字段
    if (!projectData.name) {
      return Response.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    // 验证项目名称是否已存在
    if (await isExistByName(projectData.name)) {
      return Response.json({ error: '项目名称已存在' }, { status: 400 });
    }
    // 创建项目
    const newProject = await createProject(projectData);
    return Response.json(newProject, { status: 201 });
  } catch (error) {
    console.error('创建项目出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // 获取所有项目
    const projects = await getProjects();
    return Response.json(projects);
  } catch (error) {
    console.error('获取项目列表出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
