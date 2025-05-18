import { getProjectRoot } from '@/lib/db/base';
import { getTaskConfig } from '@/lib/db/projects';
import convertPrompt from '@/lib/llm/prompts/pdfToMarkdown';
import convertPromptEn from '@/lib/llm/prompts/pdfToMarkdownEn';
import reTitlePrompt from '@/lib/llm/prompts/optimalTitle';
import reTitlePromptEn from '@/lib/llm/prompts/optimalTitleEn';
import path from 'path';
import { getModelConfigByProjectId } from '@/lib/db/model-config';
import { parsePdf } from '@tiny-tool/pdf2md';
import taskManager from '@/lib/task/taskManager';

class VisionStrategyTask {
  async process(projectId, fileName, options) {
    try {
      console.log('正在执行VisionTask转换策略......');
      // 获取项目路径
      const projectRoot = await getProjectRoot();
      const projectPath = path.join(projectRoot, projectId);
      const filePath = path.join(projectPath, 'files', fileName);
      // 获取项目 task-config 和 models 信息
      const taskConfig = await getTaskConfig(projectId);
      const modelConfig = await getModelConfigByProjectId(projectId);
      const visionId = options.visionModelId;
      if (visionId === undefined || visionId === null || visionId === '') {
        throw new Error('请检查是否配置PDF转换视觉大模型');
      }

      const model = modelConfig.find(item => item.id === visionId);

      if (model.type !== 'vision') {
        throw new Error(`${model.name}(${model.provider}) 此模型不是视觉大模型，请检查【模型配置】`);
      }

      if (!model.apiKey) {
        throw new Error(`${model.name}(${model.provider}) 此模型未配置API密钥，请检查【模型配置】`);
      }

      const convert = options.language === 'en' ? convertPrompt : convertPromptEn;

      const reTitle = options.language === 'en' ? reTitlePrompt : reTitlePromptEn;

      const taskFn = async updateProgress => {
        //用户从parsePdf中回传进度信息
        const progressState = { strategy: 'vision', current: 0, total: 0, taskStatus: 'pending' };
        const config = {
          // 测试PDF文件路径
          pdfPath: filePath,

          // 输出目录
          outputDir: path.join(projectPath, 'files'),

          // API密钥 (从环境变量获取或手动设置)
          apiKey: model.apiKey,

          // 模型配置
          model: model.modelId,

          // 模型地址
          baseUrl: model.endpoint,

          // 使用全页模式
          useFullPage: true,

          // 是否保留中间生成的图像文件
          verbose: false,

          // 并发处理数量
          concurrency: taskConfig.visionConcurrencyLimit,

          //设置PDF转换提示词
          prompt: convert(),

          //设置优化md文件标题提示词
          textPrompt: reTitle(),
          //回调函数
          onProgress: ({ current, total, taskStatus }) => {
            progressState.current = current;
            progressState.total = total;
            progressState.taskStatus = taskStatus;
          }
        };
        //先尝试正常调
        console.log('Vison策略 开始处理PDF文件');
        const parsedResult = parsePdf(
          filePath,
          {
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
            model: config.model
          },
          config
        );
        //定时器更新进度
        await new Promise(resolve => {
          const interval = setInterval(async () => {
            //更新进度信息到task表
            await updateProgress(Number((progressState.current / progressState.total) * 100) || 0, progressState);
            if (progressState.taskStatus === 'finished') {
              clearInterval(interval);
              resolve();
            }
          }, 1000);
        });
        console.log('Vison策略 执行成功！');
      };

      //创建任务
      const task = await taskManager.createTask('VisionStrategy:' + fileName, '', projectId);

      //开始执行任务
      taskManager.startTask(task, taskFn).catch(err => console.error('Task error:', err));

      return task.id;
    } catch (error) {
      console.error('Vision 策略调用出错:', error);
      throw error;
    }
  }
}
module.exports = VisionStrategyTask;
