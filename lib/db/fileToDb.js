import { getProjectRoot, readJsonFile } from '@/lib/db/base';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db/index';
import { createProject, deleteProject } from '@/lib/db/projects';
import { DEFAULT_MODEL_SETTINGS } from '@/constant/model';

export async function main() {
  const projectRoot = await getProjectRoot();
  let count = 0;
  const files = await fs.promises.readdir(projectRoot, { withFileTypes: true });
  const promises = files.map(async file => {
    if (!file.name.includes('-')) {
      let projectPath = path.join(projectRoot, file.name);
      let projectId;
      try {
        let projectDB = await projectHandle(projectPath);
        if (projectDB) {
          projectId = projectDB.id;
          await syncOtherConfigFile(projectRoot, projectPath, projectId);
          await chunkHandle(projectId, projectPath);
          await modelConfigHandle(projectId, projectPath);
          await questionHandle(projectId, projectPath);
          await datasetHandle(projectId, projectPath);
          await backupHandle(projectRoot, projectPath);
          await updateQuestions(projectId);
          count++;
        }
      } catch (error) {
        await deleteProject(projectId);
        console.error(`Error processing project at path: ${projectPath}`, error);
        throw error;
      }
    }
  });

  // 等待所有异步操作完成
  await Promise.all(promises);

  return count;
}

//备份文件
async function backupHandle(projectRoot, projectPath) {
  const projectName = path.basename(projectPath);
  const newProjectName = projectName + '-backup';
  const newProjectPath = path.join(path.dirname(projectPath), newProjectName);
  try {
    await fs.promises.rename(projectPath, newProjectPath);
    console.log(`File renamed from ${projectPath} to ${newProjectPath}`);
  } catch (error) {
    console.error(`Failed to rename file from ${projectPath} to ${newProjectPath}`, error);
  }
}

//项目文件数据处理
async function projectHandle(projectPath) {
  try {
    const configPath = path.join(projectPath, 'config.json');
    let projectData = await readJsonFile(configPath);
    if (!projectData) return null;
    return await createProject(projectData);
  } catch (error) {
    console.error('Error project insert db:', error);
    throw error;
  }
}

//同步其他配置文件
async function syncOtherConfigFile(projectRoot, projectPath, projectNewId) {
  if (fs.existsSync(projectPath)) {
    const newProjectPath = path.join(projectRoot, projectNewId);
    try {
      await copyDirRecursive(projectPath, newProjectPath);
      console.log(`sync config at: ${newProjectPath}`);
    } catch (error) {
      console.error(`Failed to sync config at: ${newProjectPath}`, error);
    }
  } else {
    console.error(`Project not found at path: ${projectPath}`);
  }
}

async function modelConfigHandle(projectId, projectPath) {
  const modelConfigPath = path.join(projectPath, 'model-config.json');
  try {
    const modelConfigData = await readJsonFile(modelConfigPath);
    let modelConfigList = [];
    for (const modelConfig of modelConfigData) {
      if (!modelConfig.name) continue;
      modelConfigList.push({
        projectId,
        providerId: modelConfig.providerId,
        providerName: modelConfig.provider,
        endpoint: modelConfig.endpoint,
        apiKey: modelConfig.apiKey,
        modelId: modelConfig.name,
        modelName: modelConfig.name,
        type: modelConfig.type ? modelConfig.type : 'text',
        maxTokens: modelConfig.maxTokens ? modelConfig.maxTokens : DEFAULT_MODEL_SETTINGS.maxTokens,
        temperature: modelConfig.temperature ? modelConfig.temperature : DEFAULT_MODEL_SETTINGS.temperature,
        topK: 0,
        topP: 0,
        status: 1
      });
    }
    return await db.modelConfig.createMany({ data: modelConfigList });
  } catch (error) {
    console.error('Error model-config.json insert db:', error);
    throw error;
  }
}

//chunk文件数据处理
async function chunkHandle(projectId, projectPath) {
  try {
    const filesPath = path.join(projectPath, 'files');
    const fileList = await safeReadDir(filesPath);

    let chunkList = [];
    for (const fileName of fileList) {
      const baseName = path.basename(fileName, path.extname(fileName));
      const chunksPath = path.join(projectPath, 'chunks');
      const chunks = await safeReadDir(chunksPath, { withFileTypes: true });
      for (const chunk of chunks) {
        if (chunk.name.startsWith(baseName + '-part-')) {
          const content = await fs.promises.readFile(path.join(chunksPath, chunk.name), 'utf8');
          chunkList.push({
            name: path.basename(chunk.name, path.extname(chunk.name)),
            projectId,
            fileName,
            content,
            // TODO summary 暂时使用 content
            summary: content,
            size: content.length
          });
        }
      }
    }
    return await db.chunks.createMany({ data: chunkList });
  } catch (error) {
    console.error('Error chunk insert db:', error);
    throw error;
  }
}

//问题文件处理
async function questionHandle(projectId, projectPath) {
  const questionsPath = path.join(projectPath, 'questions.json');
  let questionList = [];
  try {
    const questionsData = await readJsonFile(questionsPath);
    for (const question of questionsData) {
      // 确保 chunk 已存在
      let chunk = await db.chunks.findFirst({ where: { name: question.chunkId, projectId } });
      if (!chunk) {
        console.error(`Chunk with name ${question.chunkId} not found for project ${projectPath}`);
        continue;
      }
      for (const item of question.questions) {
        const questionData = {
          projectId: projectId,
          chunkId: chunk.id,
          question: item.question,
          label: item.label
        };
        questionList.push(questionData);
      }
    }
    return await db.questions.createMany({ data: questionList });
  } catch (error) {
    console.error('Error questions.json insert db:', error);
    throw error;
  }
}

//数据集文件处理
async function datasetHandle(projectId, projectPath) {
  const datasetsPath = path.join(projectPath, 'datasets.json');
  let datasetList = [];
  try {
    const datasetsData = await readJsonFile(datasetsPath);
    for (const dataset of datasetsData) {
      let chunk = await db.chunks.findFirst({ where: { name: dataset.chunkId, projectId } });
      if (!chunk) {
        console.error(`Chunk with name ${dataset.chunkId} not found for project ${projectPath}`);
        continue;
      }
      const datasetData = {
        projectId: projectId,
        chunkId: chunk.id,
        question: dataset.question,
        answer: dataset.answer,
        model: dataset.model,
        questionLabel: dataset.questionLabel,
        createAt: dataset.createdAt,
        cot: dataset.cot ? dataset.cot : '',
        confirmed: dataset.confirmed ? dataset.confirmed : false
      };
      datasetList.push(datasetData);
    }
    return await db.datasets.createMany({ data: datasetList });
  } catch (error) {
    console.error('Error datasets.json insert db:', error);
    throw error;
  }
}

//批量更新问题的答案状态
async function updateQuestions(projectId) {
  const result = await prisma.$queryRaw`
    UPDATE Questions
    SET answered = 1
    WHERE EXISTS (
      SELECT 1
      FROM Datasets d
      WHERE d.question = Questions.question
        AND Questions.projectId = ${projectId}
    )
  `;

  console.log(result);
}

// 复制文件夹
async function copyDirRecursive(src, dest) {
  try {
    // 检查源路径是否存在
    if (!fs.existsSync(src)) {
      console.error(`Source directory not found: ${src}`);
      return;
    }

    // 确保目标路径存在
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    // 读取源路径下的所有文件和子目录
    const entries = await fs.promises.readdir(src, { withFileTypes: true });

    let old = ['config.json', 'chunks', 'questions.json', 'datasets.json', 'model-config.json'];

    for (const entry of entries) {
      if (old.includes(entry.name)) {
        continue;
      }

      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        // 如果是目录，递归复制
        await copyDirRecursive(srcPath, destPath);
      } else {
        // 如果是文件，直接复制
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error(`Failed to copy directory from ${src} to ${dest}`, error);
  }
}

async function safeReadDir(dirPath, options = {}) {
  try {
    if (fs.existsSync(dirPath)) {
      return await fs.promises.readdir(dirPath, options);
    }
    return [];
  } catch (error) {
    console.error(`Error reading directory: ${dirPath}`, error);
    return [];
  }
}
