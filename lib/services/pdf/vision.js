import { getProjectRoot } from '@/lib/db/base';
import { getTaskConfig } from '@/lib/db/projects';
import convertPrompt from '@/lib/llm/prompts/pdfToMarkdown';
import convertPromptEn from '@/lib/llm/prompts/pdfToMarkdownEn';
import reTitlePrompt from '@/lib/llm/prompts/optimalTitle';
import reTitlePromptEn from '@/lib/llm/prompts/optimalTitleEn';
import path from 'path';
import fs from 'fs';
import { parsePdf } from '@tiny-tool/pdf2md';

export async function visionProcessing(projectId, fileName, options = {}) {
    try {
        const { updateTask, task } = options;

        console.log('正在执行Vision转换策略......');

        // 获取项目路径
        const projectRoot = await getProjectRoot();
        const projectPath = path.join(projectRoot, projectId);
        const filePath = path.join(projectPath, 'files', fileName);

        // 获取项目配置
        const taskConfig = await getTaskConfig(projectId);

        const model = JSON.parse(task.modelInfo);
    
        if (!model) {
            throw new Error('请检查是否配置PDF转换视觉大模型');
        }

        if (model.type !== 'vision') {
            throw new Error(`${model.modelName}(${model.providerName}) 此模型不是视觉大模型，请检查【模型配置】`);
        }

        if (!model.apiKey) {
            throw new Error(`${model.modelName}(${model.providerName}) 此模型未配置API密钥，请检查【模型配置】`);
        }

        const convert = task.language === 'en' ? convertPromptEn : convertPrompt;
        const reTitle = task.language === 'en' ? reTitlePromptEn : reTitlePrompt;

        //创建临时文件夹分割不同任务产生的临时图片文件，防止同时读写一个文件夹，导致内容出错
        const tempDir = path.join(projectPath, 'files', task.id);
        const config = {
            pdfPath: filePath,
            outputDir: tempDir,
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
                        detail: `已处理 ${current}/${total} 页 处理进度: ${(current/total) * 100 }% `,
                    });
                }
            }
        };
        
        console.log('Vision策略 开始处理PDF文件');
        await parsePdf(
            filePath,
            {
                apiKey: config.apiKey,
                baseURL: config.baseUrl,
                model: config.model
            },
            config
        );

        //转换后的文件名
        const newFileName = fileName.replace(".pdf",".md");

        //从单个任务文件夹中拷贝出来
        fs.copyFileSync(path.join(tempDir,newFileName), path.join(projectPath,"files",newFileName));

        //清理临时文件夹
        fs.rmSync(tempDir, { recursive: true, force: true });

        //转换结束
        return { success: true };
    } catch (error) {
        console.error('Vision策略处理出错:', error);
        throw error;
    }
}

export default {
    visionProcessing
};
