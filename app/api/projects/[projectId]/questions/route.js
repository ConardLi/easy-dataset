import { NextResponse } from 'next/server';
import { getQuestions } from '@/lib/db/questions';
import { getDatasets } from '@/lib/db/datasets';
import getQuestionEnPrompt from '@/lib/llm/prompts/questionEn';
import getAddLabelPrompt from '@/lib/llm/prompts/addLabel';
import getAddLabelEnPrompt from '@/lib/llm/prompts/addLabelEn';
import { extractJsonFromLLMOutput } from '@/lib/llm/common/util';
import { addQuestionsManul } from '@/lib/db/questions';
import { getTags } from '@/lib/db/tags';
import LLMClient from '@/lib/llm/core/index';

// 获取项目的所有问题
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    // 获取问题列表
    const nestedQuestions = await getQuestions(projectId);

    // 获取数据集
    const datasets = await getDatasets(projectId);

    // 将嵌套的问题数据结构拍平
    const flattenedQuestions = [];

    nestedQuestions.forEach(item => {
      const { chunkId, questions } = item;

      if (questions && Array.isArray(questions)) {
        questions.forEach(question => {
          const dataSites = datasets.filter(dataset => dataset.question === question.question);
          flattenedQuestions.push({
            ...question,
            chunkId,
            dataSites
          });
        });
      }
    });

    return NextResponse.json(flattenedQuestions);
  } catch (error) {
    console.error('获取问题列表失败:', error);
    return NextResponse.json({ error: error.message || '获取问题列表失败' }, { status: 500 });
  }
}

// 手动创建问题
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    console.log("请求信息:",request);
    // 获取请求体
    const { model, language = '中文', question, chunkId } = await request.json();

    if (!model) {
      return NextResponse.json({ error: '请选择模型' }, { status: 400 });
    }
    // 验证必要的字段
    if (!projectId || !question || !chunkId) {
      return Response.json({ error: '项目ID,问题,文本块不能为空' }, { status: 400 });
    }

    // 创建LLM客户端
    const llmClient = new LLMClient({
      provider: model.provider,
      endpoint: model.endpoint,
      apiKey: model.apiKey,
      model: model.name,
    });
   // 打标签
   const tags = await getTags(projectId);
   console.log('Tags:', tags);
   // 根据语言选择相应的标签提示词函数
   const labelPromptFunc = language === 'en' ? getAddLabelEnPrompt : getAddLabelPrompt;
   const labelPrompt = labelPromptFunc(JSON.stringify(tags), JSON.stringify(question));
   const llmLabelRes = await llmClient.chat(labelPrompt);
   const labelResponse = llmLabelRes.choices?.[0]?.message?.content ||
     llmLabelRes.response ||
     '';
  // let data = [
  //   {
  //     "question": "storybook能干什么111？",
  //     "label": "2.2 RN Storybook (ondevice)"
  //   }
  // ];

   // console.log('LLM Label Response:', labelResponse);
   // 从LLM输出中提取JSON格式的问题列表
   const labelQuestions = extractJsonFromLLMOutput(labelResponse);
   console.log(projectId, chunkId, 'Label Questions：', labelQuestions);

   // 保存问题到数据库
   await addQuestionsManul(projectId, chunkId, labelQuestions);

   // 返回生成的问题
   return NextResponse.json({
     chunkId,
     labelQuestions,
     total: labelQuestions.length
   });
  } catch (error) {
    console.error('创建问题出错:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
