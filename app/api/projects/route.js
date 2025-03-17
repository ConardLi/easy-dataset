import { createProject, getProjects, deleteProject } from '@/lib/db/index';

export async function POST(request) {
  try {
    const projectData = await request.json();

    // 验证必要的字段
    if (!projectData.name) {
      return Response.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    // 创建项目
    const newProject = await createProject(projectData);
    return Response.json(newProject, { status: 201 });
  } catch (error) {
    console.error('创建项目出错:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {

    // 获取所有项目
    const userProjects = await getProjects();

    // 为每个项目添加问题数量和数据集数量
    const projectsWithStats = await Promise.all(userProjects.map(async (project) => {
      // 获取问题数量
      const questions = await import('@/lib/db/questions').then(module => module.getQuestions(project.id)) || [];
      const ques = questions.map(q => q.questions).flat();
      const questionsCount = ques.length;

      // 获取数据集数量
      const datasets = await import('@/lib/db/datasets').then(module => module.getDatasets(project.id));
      const datasetsCount = Array.isArray(datasets) ? datasets.length : 0;

      // 添加最后更新时间
      const lastUpdated = new Date().toLocaleDateString('zh-CN');

      return {
        ...project,
        questionsCount,
        datasetsCount,
        lastUpdated
      };
    }));

    return Response.json(projectsWithStats);
  } catch (error) {
    console.error('获取项目列表出错:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
