import { getProjectRoot } from '@/lib/db/base';
import { getTaskConfig } from '@/lib/db/projects';
import convertPrompt from '@/lib/llm/prompts/pdfToMarkdown';
import convertPromptEn from '@/lib/llm/prompts/pdfToMarkdownEn';
import reTitlePrompt from '@/lib/llm/prompts/optimalTitle';
import reTitlePromptEn from '@/lib/llm/prompts/optimalTitleEn';
import path from 'path';
import { getModelConfigByProjectId } from '@/lib/db/model-config';
import { parsePdf } from '@tiny-tool/pdf2md';

class VisionStrategy {
  async process(projectId, fileName, options) {
    try {
      console.log('正在执行Vision转换策略......');
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

      //模型使用前检查
      if (!model) {
        throw new Error('请检查是否配置PDF转换视觉大模型');
      }

      if (model.type !== 'vision') {
        throw new Error(`${model.modelName}(${model.providerName}) 此模型不是视觉大模型，请检查【模型配置】`);
      }

      if (!model.apiKey) {
        throw new Error(`${model.modelName}(${model.providerName}) 此模型未配置API密钥，请检查【模型配置】`);
      }

      //豆包和chatgpt模型特殊处理一下
      let baseUrl = model.endpoint;

      const convert = options.language === 'en' ? convertPrompt : convertPromptEn;

      const reTitle = options.language === 'en' ? reTitlePrompt : reTitlePromptEn;

      const config = {
        // 测试PDF文件路径
        pdfPath: filePath,

        // 输出目录
        outputDir: path.join(projectPath, 'files'),

        // API密钥 (从环境变量获取或手动设置)
        apiKey: model.apiKey,

        // 模型配置
        model: model.modelId,
        baseUrl: baseUrl,

        // 使用全页模式
        useFullPage: true,

        // 是否保留中间生成的图像文件
        verbose: false,

        // 并发处理数量
        concurrency: taskConfig.visionConcurrencyLimit,

        //设置PDF转换提示词
        prompt: convert(),

        //设置优化md文件标题提示词
        textPrompt: reTitle()
      };
      //先尝试正常调
      console.log('Vison策略 开始处理PDF文件');
      const parsedResult = await parsePdf(
        filePath,
        {
          apiKey: config.apiKey,
          baseURL: config.baseUrl,
          model: config.model
        },
        config
      );
      console.log('Vison策略 执行成功！');
    } catch (error) {
      console.error('Vision 策略调用出错:', error);
      throw error;
    }
  }
}

module.exports = VisionStrategy;
