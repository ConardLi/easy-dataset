/**
 * PDF处理任务处理器
 * 负责异步处理文本文件，包括PDF和Markdown等格式
 */
import { splitProjectFile } from '@/lib/file/text-splitter';
import { handleDomainTree } from '@/lib/util/domain-tree';
import { PrismaClient } from '@prisma/client';
import { updateTask } from './index';
import { processPdf } from '@/lib/services/pdf';
import { getProject,updateProject } from '@/lib/db/projects';

const prisma = new PrismaClient();

/**
 * 处理PDF处理任务
 * @param {Object} task 任务对象
 * @returns {Promise<void>}
 */
export async function processPdfProcessingTask(task) {
  try {
    console.log(`开始处理PDF解析任务: ${task.id}`);

    // 解析任务参数
    let params;
    try {
      params = JSON.parse(task.note);
    } catch (error) {
      throw new Error(`任务参数解析失败: ${error.message}`);
    }

    const { projectId, file, fileType = 'pdf', strategy = 'default', textModel } = params;

    if (!projectId || !file) {
     
      throw new Error('缺少必要参数: projectId 或 file');
    }

    // 解析模型信息
    let modelInfo;
    if(strategy === "vision"){
      try {
        modelInfo = JSON.parse(task.modelInfo);
      } catch (error) {
        throw new Error(`模型信息解析失败: ${error.message}`);
      }
    }

    // 更新任务状态
    await updateTask(task.id, {
      status: 0, // 0表示处理中
      totalCount: 1, // 通常只有一个文件
      detail: `${file.fileName} 解析${strategy}策略`,
      startTime: new Date()
    });

    try {
      // 调用PDF处理服务
      const result = await processPdf(strategy, projectId, file.fileName, {
        ...params.options,
        updateTask: updateTask,
        task: task
      });

      if (!result.success) {
        throw new Error(result.error || `${strategy}策略处理失败`);
      }

      //进行文本分割
      let pdfResult = {
        totalChunks: 0,
        chunks: [],
        toc: ''
      };

      const project = await getProject(projectId);

      const { toc, chunks, totalChunks } = await splitProjectFile(projectId, file);
      pdfResult.toc += toc;
      pdfResult.chunks.push(...chunks);
      pdfResult.totalChunks += totalChunks;
      console.log(projectId, file.fileName, `Text split completed, ${file.action} domain tree`);

      // 调用领域树处理模块
      const tags = await handleDomainTree({
        projectId,
        newToc: pdfResult.toc,
        model: textModel ? JSON.parse(textModel) : modelInfo,
        language: task.language,
        action: file.action,
        file,
        project
      });

      if (!tags && file.action !== 'keep') {
        await updateProject(projectId, { ...project });
        return NextResponse.json(
          { error: 'AI analysis failed, please check model configuration, delete file and retry!' },
          { status: 400 }
        );
      }

      //整个转换任务=》文本分割=》领域树构造结束后 转换完成
      console.log(`${strategy}策略处理成功: ${file.fileName}`);
      // 更新任务进度
      await updateTask(task.id, {
        status: 1,
        detail: `${strategy}策略处理成功`+ JSON.stringify({
          ...result.data,
          strategy,
          status: 'completed'
        }),
      });
    } catch (error) {
      console.error(`处理文件 ${file.fileName} 出错:`, error);

      // 更新任务状态为失败
      await updateTask(task.id, {
        status: 2, // 2表示失败
        completedCount: 0,
        detail: `${file.fileName},${strategy}策略处理失败: ${error.message}`,
        endTime: new Date()
      });

      return;
    }
    console.log(`任务 ${task.id} 已完成`);
  } catch (error) {
    console.error('处理文本处理任务出错:', error);
    await updateTask(task.id, {
      status: 2, // 2表示失败
      detail: `处理失败: ${error.message}`,
      endTime: new Date()
    });
  }
}

export default {
  processPdfProcessingTask
};
