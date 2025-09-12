/**
 * 文件处理任务
 */
import { splitProjectFile } from '@/lib/file/text-splitter';
import { handleDomainTree } from '@/lib/util/domain-tree';
import { processPdf, getFilePageCount } from '@/lib/file/file-process/pdf';
import { getProject, updateProject } from '@/lib/db/projects';
import path from 'path';
import { TASK } from '@/constant';
import { updateTask } from './index';

/**
 * 处理文件处理任务
 * @param {Object} task 任务对象
 */
export async function processFileProcessingTask(task) {
  const taskMessage = {
    current: {
      fileName: '',
      processedPage: 0,
      totalPage: 0
    },
    stepInfo: '',
    processedFiles: 0,
    totalFiles: 0,
    errorList: [],
    finishedList: []
  };
  try {
    console.log(`start processing file processing task: ${task.id}`);

    const params = JSON.parse(task.note);
    const { projectId, fileList, strategy = 'default', vsionModel, domainTreeAction } = params;

    // 记录文件总数
    taskMessage.totalFiles = fileList.length;

    // 计算转换总页数
    const totalPages = await getFilePageCount(projectId, fileList);

    // 更新任务信息
    taskMessage.stepInfo = `Total ${taskMessage.totalFiles} files to process, total ${totalPages} pages`;

    // 更新任务状态
    await updateTask(task.id, {
      status: TASK.STATUS.PROCESSING,
      totalCount: totalPages + 1, // 总页数 + 领域树处理
      detail: JSON.stringify(taskMessage),
      startTime: new Date()
    });

    //进行文本分割
    let fileResult = {
      totalChunks: 0,
      chunks: [],
      toc: ''
    };

    const project = await getProject(projectId);

    // 循环处理文件
    for (const file of fileList) {
      try {
        let result = {};
        taskMessage.current.fileName = file.fileName;
        taskMessage.current.processedPage = 1; // 重置当前处理页数
        taskMessage.current.totalPage = file.pageCount || 1; // 设置当前文件总页数

        await updateTask(task.id, {
          status: TASK.STATUS.PROCESSING,
          totalCount: totalPages + 1, // 总页数 + 领域树处理
          detail: JSON.stringify(taskMessage),
          startTime: new Date()
        });

        if (file.fileName.endsWith('.pdf')) {
          task.vsionModel = vsionModel; // 仅用于视觉模型处理
          result = await processPdf(strategy, projectId, file.fileName, {
            ...params.options,
            updateTask: updateTask,
            task: task,
            message: taskMessage
          });
          //确认文件处理状态
          if (!result.success) {
            throw new Error(result.error || `File processing failed`);
          }
        }

        // 文本分割
        const fileToSplit = result.path ? { ...file, fileName: path.basename(result.path) } : file;
        const { toc, chunks, totalChunks } = await splitProjectFile(projectId, fileToSplit);
        fileResult.toc += toc;
        fileResult.chunks.push(...chunks);
        fileResult.totalChunks += totalChunks;
        console.log(projectId, file.fileName, `${file.fileName} Text split completed`);

        // 更新任务信息
        taskMessage.finishedList.push(file);
        taskMessage.processedFiles++;
        await updateTask(task.id, {
          completedCount: task.completedCount + file.pageCount, // 已处理页数
          detail: JSON.stringify(taskMessage), // 更新任务信息
          updateAt: new Date()
        });
        task.completedCount += file.pageCount; // 更新任务已完成页数
      } catch (error) {
        const errorMessage = `Processing file ${file.fileName} failed: ${error.message}`;
        taskMessage.errorList.push(errorMessage);
        console.error(errorMessage);
        //将文件粒度的任务信息存储到任务详情中
        await updateTask(task.id, {
          detail: JSON.stringify(taskMessage)
        });
      }
    }

    console.log('domainTreeAction', domainTreeAction);
    try {
      // 调用领域树处理模块
      const tags = await handleDomainTree({
        projectId,
        newToc: fileResult.toc,
        model: JSON.parse(task.modelInfo),
        language: task.language,
        action: domainTreeAction,
        fileList,
        project
      });

      if (!tags && domainTreeAction !== 'keep') {
        await updateProject(projectId, { ...project });
        return NextResponse.json(
          { error: 'AI analysis failed, please check model configuration, delete file and retry!' },
          { status: 400 }
        );
      }

      //整个转换任务=》文本分割=》领域树构造结束后 转换完成
      console.log(`File processing completed successfully`);
      // 更新任务进度
      taskMessage.stepInfo = `File processing completed successfully`;
      await updateTask(task.id, {
        completedCount: task.totalCount,
        status: TASK.STATUS.COMPLETED,
        detail: JSON.stringify(taskMessage)
      });
    } catch (error) {
      console.error(`processing failed:`, error);
      taskMessage.stepInfo = `File processing failed: ${error.message}`;
      // 更新任务状态为失败
      await updateTask(task.id, {
        status: TASK.STATUS.FAILED,
        completedCount: 0,
        detail: JSON.stringify(taskMessage),
        endTime: new Date()
      });
      return;
    }
    console.log(`task ${task.id} finished`);
  } catch (error) {
    console.error('pdf processing failed:', error);
    taskMessage.stepInfo = `File processing failed: ${String(error)}`;
    await updateTask(task.id, {
      status: TASK.STATUS.FAILED,
      detail: JSON.stringify(taskMessage),
      endTime: new Date()
    });
  }
}

export default {
  processFileProcessingTask
};
