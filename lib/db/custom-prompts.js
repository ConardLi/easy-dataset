'use server';
import { db } from '@/lib/db/index';

/**
 * 获取项目的自定义提示词
 * @param {string} projectId 项目ID
 * @param {string} promptType 提示词类型 (如: question, answer, label等)
 * @param {string} language 语言 (zh-CN, en)
 * @returns {Promise<Array>} 自定义提示词列表
 */
export async function getCustomPrompts(projectId, promptType = null, language = null) {
  try {
    const where = {
      projectId,
      isActive: true
    };

    if (promptType) {
      where.promptType = promptType;
    }

    if (language) {
      where.language = language;
    }

    return await db.customPrompts.findMany({
      where,
      orderBy: {
        createAt: 'desc'
      }
    });
  } catch (error) {
    console.error('Failed to get custom prompts:', error);
    throw error;
  }
}

/**
 * 获取特定的自定义提示词内容
 * @param {string} projectId 项目ID
 * @param {string} promptType 提示词类型
 * @param {string} promptKey 提示词键名
 * @param {string} language 语言
 * @returns {Promise<Object|null>} 自定义提示词对象或null
 */
export async function getCustomPrompt(projectId, promptType, promptKey, language) {
  try {
    return await db.customPrompts.findUnique({
      where: {
        projectId_promptType_promptKey_language: {
          projectId,
          promptType,
          promptKey,
          language
        }
      }
    });
  } catch (error) {
    console.error('Failed to get custom prompt:', error);
    return null;
  }
}

/**
 * 保存自定义提示词
 * @param {string} projectId 项目ID
 * @param {string} promptType 提示词类型
 * @param {string} promptKey 提示词键名
 * @param {string} language 语言
 * @param {string} content 提示词内容
 * @returns {Promise<Object>} 保存后的提示词对象
 */
export async function saveCustomPrompt(projectId, promptType, promptKey, language, content) {
  try {
    return await db.customPrompts.upsert({
      where: {
        projectId_promptType_promptKey_language: {
          projectId,
          promptType,
          promptKey,
          language
        }
      },
      update: {
        content,
        updateAt: new Date()
      },
      create: {
        projectId,
        promptType,
        promptKey,
        language,
        content
      }
    });
  } catch (error) {
    console.error('Failed to save custom prompt:', error);
    throw error;
  }
}

/**
 * 删除自定义提示词
 * @param {string} projectId 项目ID
 * @param {string} promptType 提示词类型
 * @param {string} promptKey 提示词键名
 * @param {string} language 语言
 * @returns {Promise<boolean>} 删除成功返回true
 */
export async function deleteCustomPrompt(projectId, promptType, promptKey, language) {
  try {
    await db.customPrompts.delete({
      where: {
        projectId_promptType_promptKey_language: {
          projectId,
          promptType,
          promptKey,
          language
        }
      }
    });
    return true;
  } catch (error) {
    console.error('Failed to delete custom prompt:', error);
    return false;
  }
}

/**
 * 批量保存自定义提示词
 * @param {string} projectId 项目ID
 * @param {Array} prompts 提示词数组
 * @returns {Promise<Array>} 保存结果
 */
export async function batchSaveCustomPrompts(projectId, prompts) {
  try {
    const results = [];
    for (const prompt of prompts) {
      const { promptType, promptKey, language, content } = prompt;
      const result = await saveCustomPrompt(projectId, promptType, promptKey, language, content);
      results.push(result);
    }
    return results;
  } catch (error) {
    console.error('Failed to batch save custom prompts:', error);
    throw error;
  }
}

/**
 * 启用/禁用自定义提示词
 * @param {string} id 提示词ID
 * @param {boolean} isActive 是否启用
 * @returns {Promise<Object>} 更新后的提示词对象
 */
export async function toggleCustomPrompt(id, isActive) {
  try {
    return await db.customPrompts.update({
      where: { id },
      data: { isActive, updateAt: new Date() }
    });
  } catch (error) {
    console.error('Failed to toggle custom prompt:', error);
    throw error;
  }
}

/**
 * 获取项目的所有自定义提示词（不分页）
 * @param {string} projectId 项目ID
 * @returns {Promise<Array>} 所有自定义提示词
 */
export async function getAllCustomPrompts(projectId) {
  try {
    return await db.customPrompts.findMany({
      where: { projectId },
      orderBy: { createAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to get all custom prompts:', error);
    throw error;
  }
}

/**
 * 清除项目的所有自定义提示词
 * @param {string} projectId 项目ID
 * @returns {Promise<number>} 删除数量
 */
export async function clearAllCustomPrompts(projectId) {
  try {
    const result = await db.customPrompts.deleteMany({
      where: { projectId }
    });
    return result.count;
  } catch (error) {
    console.error('Failed to clear custom prompts:', error);
    throw error;
  }
}

/**
 * 获取所有可用的提示词类型和键名信息
 * @returns {Promise<Object>} 提示词配置信息
 */
export async function getPromptTemplates() {
  // 重新组织的提示词分类配置
  return {
    generation: {
      displayName: {
        'zh-CN': '内容生成',
        en: 'Content Generation',
        tr: 'İçerik Üretimi'
      },
      prompts: {
        QUESTION_PROMPT: {
          name: '基础问题生成',
          description:
            '根据文本内容生成高质量问题的基础提示词，变量：{{text}} 待生成问题的文本，{{textLength}} 文本字数，{{number}} 目标问题数量，可选 {{gaPrompt}} 用于体裁受众增强',
          type: 'question'
        },
        QUESTION_PROMPT_EN: {
          name: 'Basic Question Generation',
          description:
            'Prompt for generating high-quality questions from text content in English. Variables: {{text}} source text, {{textLength}} text length, {{number}} question count, optional {{gaPrompt}} for GA enhancement',
          type: 'question'
        },
        QUESTION_PROMPT_TR: {
          name: 'Temel Soru Üretimi',
          description:
            'Metin içeriğinden yüksek kaliteli sorular üretmek için temel istem. Değişkenler: {{text}} kaynak metin, {{textLength}} metin uzunluğu, {{number}} soru sayısı, isteğe bağlı {{gaPrompt}} tür-kitle geliştirmesi',
          type: 'question'
        },
        ANSWER_PROMPT: {
          name: '基础答案生成',
          description:
            '基于给定文本和问题生成准确答案的基础提示词，变量：{{text}} 参考文本，{{question}} 需要回答的问题，{{templatePrompt}} 问题模版提示词，{{outputFormatPrompt}} 问题模版自定义输出格式',
          type: 'answer'
        },
        ANSWER_PROMPT_EN: {
          name: 'Basic Answer Generation',
          description:
            'Prompt for generating accurate answers based on given text and questions in English. Variables: {{text}} reference text, {{question}} question to answer, {{templatePrompt}} question template prompt, {{outputFormatPrompt}} question template custom output format',
          type: 'answer'
        },
        ANSWER_PROMPT_TR: {
          name: 'Temel Cevap Üretimi',
          description:
            'Verilen metin ve sorulara dayalı doğru cevaplar üretmek için temel istem. Değişkenler: {{text}} referans metin, {{question}} cevaplanacak soru, {{templatePrompt}} soru şablonu istemi, {{outputFormatPrompt}} özel çıktı formatı',
          type: 'answer'
        },
        ENHANCED_ANSWER_PROMPT: {
          name: 'MGA增强答案生成',
          description:
            '结合体裁受众信息生成风格化答案的高级提示词，变量：{{text}} 参考文本，{{question}} 原始问题，可选 {{gaPrompt}} 表示体裁受众要求，{{templatePrompt}} 问题模版提示词，{{outputFormatPrompt}} 问题模版自定义输出格式',
          type: 'enhancedAnswer'
        },
        ENHANCED_ANSWER_PROMPT_EN: {
          name: 'MGA Enhanced Answer Generation',
          description:
            'Advanced prompt for generating stylized answers with GA information in English. Variables: {{text}} reference content, {{question}} original question, optional {{gaPrompt}} for GA adaptation, {{templatePrompt}} question template prompt, {{outputFormatPrompt}} question template custom output format',
          type: 'enhancedAnswer'
        },
        ENHANCED_ANSWER_PROMPT_TR: {
          name: 'MGA Geliştirilmiş Cevap Üretimi',
          description:
            'Tür-kitle bilgisiyle stilize cevaplar üretmek için gelişmiş istem. Değişkenler: {{text}} referans içerik, {{question}} orijinal soru, isteğe bağlı {{gaPrompt}} tür-kitle uyarlaması, {{templatePrompt}} soru şablonu istemi, {{outputFormatPrompt}} özel çıktı formatı',
          type: 'enhancedAnswer'
        },
        GA_GENERATION_PROMPT: {
          name: 'GA组合生成',
          description: '根据文本内容自动生成体裁受众组合的提示词，变量：{{text}} 原始文本',
          type: 'ga-generation'
        },
        GA_GENERATION_PROMPT_EN: {
          name: 'GA Pair Generation',
          description:
            'Prompt for automatically generating GA pairs from text content in English. Variable: {{text}} source text',
          type: 'ga-generation'
        },
        GA_GENERATION_PROMPT_TR: {
          name: 'Tür-Kitle Çifti Üretimi',
          description:
            'Metin içeriğinden otomatik tür-kitle çiftleri üretmek için istem. Değişken: {{text}} kaynak metin',
          type: 'ga-generation'
        },
        DISTILL_QUESTIONS_PROMPT: {
          name: '问题蒸馏生成',
          description:
            '基于特定标签领域生成多样化高质量问题的蒸馏提示词，变量：{{currentTag}} 当前标签，{{tagPath}} 标签完整链路，{{count}} 目标问题数，可选 {{existingQuestions}} 用于避免重复',
          type: 'distillQuestions'
        },
        DISTILL_QUESTIONS_PROMPT_EN: {
          name: 'Question Distillation',
          description:
            'Distillation prompt for generating questions for tag domains in English. Variables: {{currentTag}} current tag, {{tagPath}} tag path, {{count}} question count, optional {{existingQuestionsText}} for deduplication',
          type: 'distillQuestions'
        },
        DISTILL_QUESTIONS_PROMPT_TR: {
          name: 'Soru Damıtma',
          description:
            'Etiket alanları için çeşitli sorular üretmek için damıtma istemi. Değişkenler: {{currentTag}} mevcut etiket, {{tagPath}} etiket yolu, {{count}} soru sayısı, isteğe bağlı {{existingQuestionsText}} tekrardan kaçınma',
          type: 'distillQuestions'
        },
        ASSISTANT_REPLY_PROMPT: {
          name: '多轮对话回复生成',
          description:
            '生成多轮对话中助手角色回复的提示词，变量：{{scenario}} 对话场景，{{roleA}} 提问者角色，{{roleB}} 回答者角色，{{chunkContent}} 原始文本，{{conversationHistory}} 对话历史，{{currentRound}} 当前轮次，{{totalRounds}} 总轮次',
          type: 'multiTurnConversation'
        },
        ASSISTANT_REPLY_PROMPT_EN: {
          name: 'Multi-turn Conversation Reply Generation',
          description:
            'Prompt for generating assistant role replies in multi-turn conversations. Variables: {{scenario}} conversation scenario, {{roleA}} questioner role, {{roleB}} responder role, {{chunkContent}} original text, {{conversationHistory}} conversation history, {{currentRound}} current round, {{totalRounds}} total rounds',
          type: 'multiTurnConversation'
        },
        ASSISTANT_REPLY_PROMPT_TR: {
          name: 'Çok Turlu Konuşma Yanıt Üretimi',
          description:
            'Çok turlu konuşmalarda asistan rolü yanıtları üretmek için istem. Değişkenler: {{scenario}} konuşma senaryosu, {{roleA}} soran rolü, {{roleB}} yanıtlayan rolü, {{chunkContent}} orijinal metin, {{conversationHistory}} konuşma geçmişi, {{currentRound}} mevcut tur, {{totalRounds}} toplam tur',
          type: 'multiTurnConversation'
        },
        NEXT_QUESTION_PROMPT: {
          name: '多轮对话问题生成',
          description:
            '基于对话历史生成下一轮问题的提示词，变量：{{scenario}} 对话场景，{{roleA}} 提问者角色，{{roleB}} 回答者角色，{{chunkContent}} 原始文本，{{conversationHistory}} 对话历史，{{nextRound}} 下一轮次，{{totalRounds}} 总轮次',
          type: 'multiTurnConversation'
        },
        NEXT_QUESTION_PROMPT_EN: {
          name: 'Multi-turn Conversation Question Generation',
          description:
            'Prompt for generating next round questions based on conversation history. Variables: {{scenario}} conversation scenario, {{roleA}} questioner role, {{roleB}} responder role, {{chunkContent}} original text, {{conversationHistory}} conversation history, {{nextRound}} next round, {{totalRounds}} total rounds',
          type: 'multiTurnConversation'
        },
        NEXT_QUESTION_PROMPT_TR: {
          name: 'Çok Turlu Konuşma Soru Üretimi',
          description:
            'Konuşma geçmişine dayalı sonraki tur soruları üretmek için istem. Değişkenler: {{scenario}} konuşma senaryosu, {{roleA}} soran rolü, {{roleB}} yanıtlayan rolü, {{chunkContent}} orijinal metin, {{conversationHistory}} konuşma geçmişi, {{nextRound}} sonraki tur, {{totalRounds}} toplam tur',
          type: 'multiTurnConversation'
        },
        IMAGE_QUESTION_PROMPT: {
          name: '图像问题生成',
          description:
            '基于图像内容生成高质量问题的专业提示词，用于构建视觉问答训练数据集。变量：{{number}} 目标问题数量',
          type: 'imageQuestion'
        },
        IMAGE_QUESTION_PROMPT_EN: {
          name: 'Image Question Generation',
          description:
            'Professional prompt for generating high-quality questions based on image content for visual question-answering training datasets. Variables: {{number}} target question count',
          type: 'imageQuestion'
        },
        IMAGE_QUESTION_PROMPT_TR: {
          name: 'Görsel Soru Üretimi',
          description:
            'Görsel soru-cevap eğitim veri setleri için görsel içeriğe dayalı yüksek kaliteli sorular üretmek için profesyonel istem. Değişkenler: {{number}} hedef soru sayısı',
          type: 'imageQuestion'
        },
        IMAGE_ANSWER_PROMPT: {
          name: '图像答案生成',
          description:
            '基于图像内容回答问题并生成答案的提示词（用于生成图像问答数据集）。变量：{{question}} 题目内容，可选 {{templatePrompt}}/{{outputFormatPrompt}} 用于问题模版与输出格式',
          type: 'imageAnswer'
        },
        IMAGE_ANSWER_PROMPT_EN: {
          name: 'Image Answer Generation',
          description:
            'Prompt for answering questions based on image content (used for generating image QA datasets). Variables: {{question}} question, optional {{templatePrompt}}/{{outputFormatPrompt}} for template and output format',
          type: 'imageAnswer'
        },
        IMAGE_ANSWER_PROMPT_TR: {
          name: 'Görsel Cevap Üretimi',
          description:
            'Görsel içeriğe dayalı soruları yanıtlamak için istem (görsel S&C veri setleri üretmek için). Değişkenler: {{question}} soru, isteğe bağlı {{templatePrompt}}/{{outputFormatPrompt}} şablon ve çıktı formatı',
          type: 'imageAnswer'
        }
      }
    },
    labeling: {
      displayName: {
        'zh-CN': '标签管理',
        en: 'Label Management',
        tr: 'Etiket Yönetimi'
      },
      prompts: {
        LABEL_PROMPT: {
          name: '领域树生成',
          description: '根据文档目录结构自动生成领域分类标签树的提示词，变量：{{text}} 待分析目录文本',
          type: 'label'
        },
        LABEL_PROMPT_EN: {
          name: 'Domain Tree Generation',
          description:
            'Prompt for generating domain label tree from document structure in English. Variable: {{text}} catalog content',
          type: 'label'
        },
        LABEL_PROMPT_TR: {
          name: 'Alan Ağacı Üretimi',
          description:
            'Belge yapısından alan sınıflandırma etiket ağacı üretmek için istem. Değişken: {{text}} katalog içeriği',
          type: 'label'
        },
        ADD_LABEL_PROMPT: {
          name: '问题标签匹配',
          description:
            '为生成的问题匹配最合适领域标签的智能匹配提示词，变量：{{label}} 标签数组，{{question}} 问题数组',
          type: 'addLabel'
        },
        ADD_LABEL_PROMPT_EN: {
          name: 'Question Label Matching',
          description:
            'Intelligent matching prompt for assigning domain labels to questions in English. Variables: {{label}} label list, {{question}} question list',
          type: 'addLabel'
        },
        ADD_LABEL_PROMPT_TR: {
          name: 'Soru Etiket Eşleştirme',
          description:
            'Sorulara alan etiketleri atamak için akıllı eşleştirme istemi. Değişkenler: {{label}} etiket listesi, {{question}} soru listesi',
          type: 'addLabel'
        },
        LABEL_REVISE_PROMPT: {
          name: '领域树修订',
          description:
            '在内容变化时对现有领域树进行增量修订的提示词，变量：{{existingTags}} 现有标签树，{{text}} 最新目录汇总，可选 {{deletedContent}}/{{newContent}} 表示删除或新增内容',
          type: 'labelRevise'
        },
        LABEL_REVISE_PROMPT_EN: {
          name: 'Domain Tree Revision',
          description:
            'Prompt for incrementally revising domain tree in English environment. Variables: {{existingTags}} current tag tree, {{text}} combined TOC, optional {{deletedContent}}/{{newContent}} blocks',
          type: 'labelRevise'
        },
        LABEL_REVISE_PROMPT_TR: {
          name: 'Alan Ağacı Revizyonu',
          description:
            'İçerik değişikliklerinde mevcut alan ağacını artımlı olarak revize etmek için istem. Değişkenler: {{existingTags}} mevcut etiket ağacı, {{text}} birleştirilmiş içindekiler, isteğe bağlı {{deletedContent}}/{{newContent}} blokları',
          type: 'labelRevise'
        },
        DISTILL_TAGS_PROMPT: {
          name: '标签蒸馏生成',
          description:
            '基于现有标签体系生成更细粒度子标签的蒸馏提示词，变量：{{parentTag}} 当前父标签，{{path}}/{{tagPath}} 标签链路，{{count}} 子标签数量，可选 {{existingTagsText}} 表示已有子标签',
          type: 'distillTags'
        },
        DISTILL_TAGS_PROMPT_EN: {
          name: 'Tag Distillation',
          description:
            'Distillation prompt for generating sub-tags based on tag system in English. Variables: {{parentTag}} parent tag, {{path}}/{{tagPath}} hierarchy path, {{count}} target number, optional {{existingTagsText}} existing sub-tags',
          type: 'distillTags'
        },
        DISTILL_TAGS_PROMPT_TR: {
          name: 'Etiket Damıtma',
          description:
            'Etiket sistemine dayalı alt etiketler üretmek için damıtma istemi. Değişkenler: {{parentTag}} üst etiket, {{path}}/{{tagPath}} hiyerarşi yolu, {{count}} hedef sayı, isteğe bağlı {{existingTagsText}} mevcut alt etiketler',
          type: 'distillTags'
        }
      }
    },
    optimization: {
      displayName: {
        'zh-CN': '内容优化',
        en: 'Content Optimization',
        tr: 'İçerik Optimizasyonu'
      },
      prompts: {
        NEW_ANSWER_PROMPT: {
          name: '答案优化重写',
          description:
            '根据用户反馈建议对答案进行优化重写的提示词，变量：{{chunkContent}} 原始文本块，{{question}} 原始问题，{{answer}} 待优化答案，{{cot}} 待优化思维链，{{advice}} 优化建议',
          type: 'newAnswer'
        },
        NEW_ANSWER_PROMPT_EN: {
          name: 'Answer Optimization Rewrite',
          description:
            'Prompt for optimizing and rewriting answers based on feedback in English. Variables: {{chunkContent}} original chunk, {{question}} question, {{answer}} answer, {{cot}} chain of thought, {{advice}} feedback',
          type: 'newAnswer'
        },
        NEW_ANSWER_PROMPT_TR: {
          name: 'Cevap Optimizasyon Yeniden Yazımı',
          description:
            'Geri bildirime dayalı cevapları optimize edip yeniden yazmak için istem. Değişkenler: {{chunkContent}} orijinal parça, {{question}} soru, {{answer}} cevap, {{cot}} düşünce zinciri, {{advice}} geri bildirim',
          type: 'newAnswer'
        },
        OPTIMIZE_COT_PROMPT: {
          name: '思维链优化',
          description:
            '优化答案中思维链推理过程和逻辑结构的提示词，变量：{{originalQuestion}} 原始问题，{{answer}} 答案，{{originalCot}} 原始思维链',
          type: 'optimizeCot'
        },
        OPTIMIZE_COT_PROMPT_EN: {
          name: 'Chain-of-Thought Optimization',
          description:
            'Prompt for optimizing chain-of-thought reasoning process in English. Variables: {{originalQuestion}} question, {{answer}} answer, {{originalCot}} original chain of thought',
          type: 'optimizeCot'
        },
        OPTIMIZE_COT_PROMPT_TR: {
          name: 'Düşünce Zinciri Optimizasyonu',
          description:
            'Düşünce zinciri akıl yürütme sürecini optimize etmek için istem. Değişkenler: {{originalQuestion}} soru, {{answer}} cevap, {{originalCot}} orijinal düşünce zinciri',
          type: 'optimizeCot'
        }
      }
    },
    processing: {
      displayName: {
        'zh-CN': '数据处理',
        en: 'Data Processing',
        tr: 'Veri İşleme'
      },
      prompts: {
        DATA_CLEAN_PROMPT: {
          name: '文本数据清洗',
          description: '清理和标准化原始文本数据格式的提示词，变量：{{text}} 需清洗文本，{{textLength}} 文本字数',
          type: 'dataClean'
        },
        DATA_CLEAN_PROMPT_EN: {
          name: 'Text Data Cleaning',
          description:
            'Prompt for cleaning and standardizing text data in English environment. Variables: {{text}} text to clean, {{text.length}} length placeholder',
          type: 'dataClean'
        },
        DATA_CLEAN_PROMPT_TR: {
          name: 'Metin Veri Temizleme',
          description:
            'Metin verilerini temizlemek ve standartlaştırmak için istem. Değişkenler: {{text}} temizlenecek metin, {{text.length}} uzunluk yer tutucusu',
          type: 'dataClean'
        }
      }
    },
    evaluation: {
      displayName: {
        'zh-CN': '质量评估',
        en: 'Quality Evaluation',
        tr: 'Kalite Değerlendirme'
      },
      prompts: {
        DATASET_EVALUATION_PROMPT: {
          name: '数据集质量评估',
          description:
            '对问答数据集进行多维度质量评估的专业提示词，变量：{{chunkContent}} 原始文本块内容，{{question}} 问题，{{answer}} 答案',
          type: 'datasetEvaluation'
        },
        DATASET_EVALUATION_PROMPT_EN: {
          name: 'Dataset Quality Evaluation',
          description:
            'Professional prompt for multi-dimensional quality evaluation of Q&A datasets. Variables: {{chunkContent}} original text chunk, {{question}} question, {{answer}} answer',
          type: 'datasetEvaluation'
        },
        DATASET_EVALUATION_PROMPT_TR: {
          name: 'Veri Seti Kalite Değerlendirmesi',
          description:
            'S&C veri setlerinin çok boyutlu kalite değerlendirmesi için profesyonel istem. Değişkenler: {{chunkContent}} orijinal metin parçası, {{question}} soru, {{answer}} cevap',
          type: 'datasetEvaluation'
        }
      }
    },
    modelEvaluation: {
      displayName: {
        'zh-CN': '模型评估',
        en: 'Model Evaluation',
        tr: 'Model Değerlendirme'
      },
      prompts: {
        // 评估题目生成
        EVAL_TRUE_FALSE_PROMPT: {
          name: '生成评估数据集（判断题）',
          description:
            '根据文本内容生成是否判断题用于评估模型，变量：{{text}} 待分析文本，{{textLength}} 文本字数，{{number}} 题目数量',
          type: 'evalQuestion'
        },
        EVAL_TRUE_FALSE_PROMPT_EN: {
          name: 'True/False Question Generation',
          description:
            'Generate true/false questions for model evaluation. Variables: {{text}} source text, {{textLength}} text length, {{number}} question count',
          type: 'evalQuestion'
        },
        EVAL_TRUE_FALSE_PROMPT_TR: {
          name: 'Doğru/Yanlış Soru Üretimi',
          description:
            'Model değerlendirmesi için doğru/yanlış soruları üretme. Değişkenler: {{text}} kaynak metin, {{textLength}} metin uzunluğu, {{number}} soru sayısı',
          type: 'evalQuestion'
        },
        EVAL_SINGLE_CHOICE_PROMPT: {
          name: '生成评估数据集（单选题）',
          description:
            '根据文本内容生成单选题用于评估模型，变量：{{text}} 待分析文本，{{textLength}} 文本字数，{{number}} 题目数量',
          type: 'evalQuestion'
        },
        EVAL_SINGLE_CHOICE_PROMPT_EN: {
          name: 'Single Choice Question Generation',
          description:
            'Generate single-choice questions for model evaluation. Variables: {{text}} source text, {{textLength}} text length, {{number}} question count',
          type: 'evalQuestion'
        },
        EVAL_SINGLE_CHOICE_PROMPT_TR: {
          name: 'Tek Seçenekli Soru Üretimi',
          description:
            'Model değerlendirmesi için tek seçenekli sorular üretme. Değişkenler: {{text}} kaynak metin, {{textLength}} metin uzunluğu, {{number}} soru sayısı',
          type: 'evalQuestion'
        },
        EVAL_MULTIPLE_CHOICE_PROMPT: {
          name: '生成评估数据集（多选题）',
          description:
            '根据文本内容生成多选题用于评估模型，变量：{{text}} 待分析文本，{{textLength}} 文本字数，{{number}} 题目数量',
          type: 'evalQuestion'
        },
        EVAL_MULTIPLE_CHOICE_PROMPT_EN: {
          name: 'Multiple Choice Question Generation',
          description:
            'Generate multiple-choice questions for model evaluation. Variables: {{text}} source text, {{textLength}} text length, {{number}} question count',
          type: 'evalQuestion'
        },
        EVAL_MULTIPLE_CHOICE_PROMPT_TR: {
          name: 'Çoktan Seçmeli Soru Üretimi',
          description:
            'Model değerlendirmesi için çoktan seçmeli sorular üretme. Değişkenler: {{text}} kaynak metin, {{textLength}} metin uzunluğu, {{number}} soru sayısı',
          type: 'evalQuestion'
        },
        EVAL_SHORT_ANSWER_PROMPT: {
          name: '生成评估数据集（短答案）',
          description:
            '根据文本内容生成短答案题用于评估模型，变量：{{text}} 待分析文本，{{textLength}} 文本字数，{{number}} 题目数量',
          type: 'evalQuestion'
        },
        EVAL_SHORT_ANSWER_PROMPT_EN: {
          name: 'Short Answer Question Generation',
          description:
            'Generate short-answer questions for model evaluation. Variables: {{text}} source text, {{textLength}} text length, {{number}} question count',
          type: 'evalQuestion'
        },
        EVAL_SHORT_ANSWER_PROMPT_TR: {
          name: 'Kısa Cevap Soru Üretimi',
          description:
            'Model değerlendirmesi için kısa cevap soruları üretme. Değişkenler: {{text}} kaynak metin, {{textLength}} metin uzunluğu, {{number}} soru sayısı',
          type: 'evalQuestion'
        },
        EVAL_OPEN_ENDED_PROMPT: {
          name: '生成评估数据集（开放问题）',
          description:
            '根据文本内容生成开放式问题用于评估模型，变量：{{text}} 待分析文本，{{textLength}} 文本字数，{{number}} 题目数量',
          type: 'evalQuestion'
        },
        EVAL_OPEN_ENDED_PROMPT_EN: {
          name: 'Open-ended Question Generation',
          description:
            'Generate open-ended questions for model evaluation. Variables: {{text}} source text, {{textLength}} text length, {{number}} question count',
          type: 'evalQuestion'
        },
        EVAL_OPEN_ENDED_PROMPT_TR: {
          name: 'Açık Uçlu Soru Üretimi',
          description:
            'Model değerlendirmesi için açık uçlu sorular üretme. Değişkenler: {{text}} kaynak metin, {{textLength}} metin uzunluğu, {{number}} soru sayısı',
          type: 'evalQuestion'
        },
        // 模型答题提示词
        TRUE_FALSE_ANSWER_PROMPT: {
          name: '执行测评（判断题）',
          description: '模型回答是否判断题的提示词，变量：{{question}} 题目内容，输出格式：✅ 或 ❌',
          type: 'modelEvaluation'
        },
        TRUE_FALSE_ANSWER_PROMPT_EN: {
          name: 'True/False Question Answering',
          description:
            'Prompt for model to answer true/false questions. Variables: {{question}} question content, output format: ✅ or ❌',
          type: 'modelEvaluation'
        },
        TRUE_FALSE_ANSWER_PROMPT_TR: {
          name: 'Doğru/Yanlış Soru Yanıtlama',
          description:
            'Modelin doğru/yanlış sorularını yanıtlaması için istem. Değişkenler: {{question}} soru içeriği, çıktı formatı: ✅ veya ❌',
          type: 'modelEvaluation'
        },
        SINGLE_CHOICE_ANSWER_PROMPT: {
          name: '执行测评（单选题）',
          description:
            '模型回答单选题的提示词，变量：{{question}} 题目内容，{{options}} 选项列表，输出格式：选项字母（A/B/C/D）',
          type: 'modelEvaluation'
        },
        SINGLE_CHOICE_ANSWER_PROMPT_EN: {
          name: 'Single Choice Question Answering',
          description:
            'Prompt for model to answer single-choice questions. Variables: {{question}} question content, {{options}} options list, output format: option letter (A/B/C/D)',
          type: 'modelEvaluation'
        },
        SINGLE_CHOICE_ANSWER_PROMPT_TR: {
          name: 'Tek Seçenekli Soru Yanıtlama',
          description:
            'Modelin tek seçenekli soruları yanıtlaması için istem. Değişkenler: {{question}} soru içeriği, {{options}} seçenek listesi, çıktı formatı: seçenek harfi (A/B/C/D)',
          type: 'modelEvaluation'
        },
        MULTIPLE_CHOICE_ANSWER_PROMPT: {
          name: '执行测评（多选题）',
          description:
            '模型回答多选题的提示词，变量：{{question}} 题目内容，{{options}} 选项列表，输出格式：JSON数组如["A", "C"]',
          type: 'modelEvaluation'
        },
        MULTIPLE_CHOICE_ANSWER_PROMPT_EN: {
          name: 'Multiple Choice Question Answering',
          description:
            'Prompt for model to answer multiple-choice questions. Variables: {{question}} question content, {{options}} options list, output format: JSON array like ["A", "C"]',
          type: 'modelEvaluation'
        },
        MULTIPLE_CHOICE_ANSWER_PROMPT_TR: {
          name: 'Çoktan Seçmeli Soru Yanıtlama',
          description:
            'Modelin çoktan seçmeli soruları yanıtlaması için istem. Değişkenler: {{question}} soru içeriği, {{options}} seçenek listesi, çıktı formatı: JSON dizisi ["A", "C"] gibi',
          type: 'modelEvaluation'
        },
        SHORT_ANSWER_PROMPT: {
          name: '执行测评（短答案）',
          description: '模型回答短答案题的提示词，变量：{{question}} 题目内容，要求极短答案（词/短语/数字/单句）',
          type: 'modelEvaluation'
        },
        SHORT_ANSWER_PROMPT_EN: {
          name: 'Short Answer Question Answering',
          description:
            'Prompt for model to answer short-answer questions. Variables: {{question}} question content, requires ultra-short answer (word/phrase/number/sentence)',
          type: 'modelEvaluation'
        },
        SHORT_ANSWER_PROMPT_TR: {
          name: 'Kısa Cevap Soru Yanıtlama',
          description:
            'Modelin kısa cevap sorularını yanıtlaması için istem. Değişkenler: {{question}} soru içeriği, çok kısa cevap gerektirir (kelime/ifade/sayı/cümle)',
          type: 'modelEvaluation'
        },
        OPEN_ENDED_ANSWER_PROMPT: {
          name: '执行测评（开放问题）',
          description: '模型回答开放式问题的提示词，变量：{{question}} 题目内容，要求全面深入的分析论述',
          type: 'modelEvaluation'
        },
        OPEN_ENDED_ANSWER_PROMPT_EN: {
          name: 'Open-ended Question Answering',
          description:
            'Prompt for model to answer open-ended questions. Variables: {{question}} question content, requires comprehensive and in-depth analysis',
          type: 'modelEvaluation'
        },
        OPEN_ENDED_ANSWER_PROMPT_TR: {
          name: 'Açık Uçlu Soru Yanıtlama',
          description:
            'Modelin açık uçlu soruları yanıtlaması için istem. Değişkenler: {{question}} soru içeriği, kapsamlı ve derinlemesine analiz gerektirir',
          type: 'modelEvaluation'
        },
        // LLM评分提示词
        SHORT_ANSWER_JUDGE_PROMPT: {
          name: 'LLM 短答案题评分',
          description:
            'LLM评估短答案题回答质量的提示词，变量：{{question}} 题目，{{correctAnswer}} 参考答案，{{modelAnswer}} 学生答案，输出JSON格式包含score和reason',
          type: 'llmJudge'
        },
        SHORT_ANSWER_JUDGE_PROMPT_EN: {
          name: 'Short Answer Grading',
          description:
            'LLM prompt for grading short-answer quality. Variables: {{question}} question, {{correctAnswer}} reference answer, {{modelAnswer}} student answer, output JSON with score and reason',
          type: 'llmJudge'
        },
        SHORT_ANSWER_JUDGE_PROMPT_TR: {
          name: 'Kısa Cevap Notlandırma',
          description:
            'Kısa cevap kalitesini notlandırmak için LLM istemi. Değişkenler: {{question}} soru, {{correctAnswer}} referans cevap, {{modelAnswer}} öğrenci cevabı, çıktı score ve reason içeren JSON',
          type: 'llmJudge'
        },
        OPEN_ENDED_JUDGE_PROMPT: {
          name: 'LLM 开放问题评分',
          description:
            'LLM评估开放式问题回答质量的提示词，变量：{{question}} 题目，{{correctAnswer}} 参考答案，{{modelAnswer}} 学生答案，输出JSON格式包含score和reason',
          type: 'llmJudge'
        },
        OPEN_ENDED_JUDGE_PROMPT_EN: {
          name: 'Open-ended Question Grading',
          description:
            'LLM prompt for grading open-ended question quality. Variables: {{question}} question, {{correctAnswer}} reference answer, {{modelAnswer}} student answer, output JSON with score and reason',
          type: 'llmJudge'
        },
        OPEN_ENDED_JUDGE_PROMPT_TR: {
          name: 'Açık Uçlu Soru Notlandırma',
          description:
            'Açık uçlu soru kalitesini notlandırmak için LLM istemi. Değişkenler: {{question}} soru, {{correctAnswer}} referans cevap, {{modelAnswer}} öğrenci cevabı, çıktı score ve reason içeren JSON',
          type: 'llmJudge'
        }
      }
    }
  };
}
