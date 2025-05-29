import { getProjectRoot } from '@/lib/db/base';
import { getTaskConfig } from '@/lib/db/projects';
import convertPrompt from '@/lib/llm/prompts/pdfToMarkdown';
import convertPromptEn from '@/lib/llm/prompts/pdfToMarkdownEn';
import reTitlePrompt from '@/lib/llm/prompts/optimalTitle';
import reTitlePromptEn from '@/lib/llm/prompts/optimalTitleEn';
import path from 'path';
import fs from 'fs';
import { parsePdf } from 'pdf2md-js';

export async function visionProcessing(projectId, fileName, options = {}) {
    try {
        const { updateTask, task } = options;

        console.log('executing vision conversion strategy......');

        // 获取项目路径
        const projectRoot = await getProjectRoot();
        const projectPath = path.join(projectRoot, projectId);
        const filePath = path.join(projectPath, 'files', fileName);

        // 获取项目配置
        const taskConfig = await getTaskConfig(projectId);

        const model = JSON.parse(task.modelInfo);
    
        if (!model) {
            throw new Error('please check if pdf conversion vision model is configured');
        }

        if (model.type !== 'vision') {
            throw new Error(`${model.modelName}(${model.providerName}) this model is not a vision model, please check [model configuration]`);
        }

        if (!model.apiKey) {
            throw new Error(`${model.modelName}(${model.providerName}) this model has no api key configured, please check [model configuration]`);
        }

        const convert = task.language === 'en' ? convertPromptEn : convertPrompt;
        const reTitle = task.language === 'en' ? reTitlePromptEn : reTitlePrompt;

        //创建临时文件夹分割不同任务产生的临时图片文件，防止同时读写一个文件夹，导致内容出错
        const config = {
            pdfPath: filePath,
            outputDir: path.join(projectPath, 'files'),
            apiKey: model.apiKey,
            model: model.modelId,
            baseUrl: model.endpoint,
            useFullPage: true,
            verbose: false,
            concurrency: taskConfig.visionConcurrencyLimit,
            prompt: convert(),
            textPrompt: reTitle(),
            onProgress: async ({ current, total, taskStatus }) => {
                if (updateTask && task.id) {
                    await updateTask(task.id, {
                        totalCount: total,
                        completedCount: current,
                        detail: `processed ${current}/${total} pages progress: ${(current/total) * 100 }% `,
                    });
                }
            }
        };
        
        console.log('vision strategy: starting pdf file processing');

        await parsePdf(filePath,config);

        //转换结束
        return { success: true };
    } catch (error) {
        console.error('vision strategy processing error:', error);
        throw error;
    }
}

export default {
    visionProcessing
};
