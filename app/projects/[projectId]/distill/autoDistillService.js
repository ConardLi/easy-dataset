'use client';

import axios from 'axios';

/**
 * 自动蒸馏服务
 */
class AutoDistillService {
  /**
   * 执行自动蒸馆任务
   * @param {Object} config - 配置信息
   * @param {string} config.projectId - 项目ID
   * @param {string} config.topic - 蒸馆主题
   * @param {number} config.levels - 标签层级
   * @param {number} config.tagsPerLevel - 每层标签数量
   * @param {number} config.questionsPerTag - 每个标签问题数量
   * @param {Object} config.model - 模型信息
   * @param {string} config.language - 语言
   * @param {Function} config.onProgress - 进度回调
   * @param {Function} config.onLog - 日志回调
   * @returns {Promise<void>}
   */
  async executeDistillTask(config) {
    const {
      projectId,
      topic,
      levels,
      tagsPerLevel,
      questionsPerTag,
      model,
      language,
      concurrencyLimit = 5,
      onProgress,
      onLog
    } = config;

    // 项目名称存储，用于整个流程共享
    this.projectName = '';

    try {
      // 初始化进度信息
      if (onProgress) {
        onProgress({
          stage: 'initializing',
          tagsTotal: 0,
          tagsBuilt: 0,
          questionsTotal: 0,
          questionsBuilt: 0,
          datasetsTotal: 0,
          datasetsBuilt: 0
        });
      }

      // 获取项目名称，只需获取一次
      try {
        const projectResponse = await axios.get(`/api/projects/${projectId}`);
        if (projectResponse && projectResponse.data && projectResponse.data.name) {
          this.projectName = projectResponse.data.name;
          this.addLog(onLog, `Using project name "${this.projectName}" as the top-level tag`);
        } else {
          this.projectName = topic; // 如果无法获取项目名称，则使用主题作为默认值
          this.addLog(onLog, `Could not find project name, using topic "${topic}" as the top-level tag`);
        }
      } catch (error) {
        this.projectName = topic; // 出错时使用主题作为默认值
        this.addLog(onLog, `Failed to get project name, using topic "${topic}" instead: ${error.message}`);
      }

      // 添加日志
      this.addLog(
        onLog,
        `Starting to build tag tree for "${topic}", number of levels: ${levels}, tags per level: ${tagsPerLevel}, questions per tag: ${questionsPerTag}`
      );

      // 从根节点开始构建标签树
      await this.buildTagTree({
        projectId,
        topic,
        levels,
        tagsPerLevel,
        model,
        language,
        onProgress,
        onLog
      });

      // 所有标签构建完成后，生成问题
      await this.generateQuestionsForTags({
        projectId,
        levels,
        questionsPerTag,
        model,
        language,
        concurrencyLimit,
        onProgress,
        onLog
      });

      // 生成数据集
      await this.generateDatasetsForQuestions({
        projectId,
        model,
        language,
        concurrencyLimit,
        onProgress,
        onLog
      });

      // 任务完成
      if (onProgress) {
        onProgress({
          stage: 'completed'
        });
      }

      this.addLog(onLog, 'Auto distillation task completed');
    } catch (error) {
      console.error('自动蒸馏任务执行失败:', error);
      this.addLog(onLog, `Task execution error: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * 构建标签树
   * @param {Object} config - 配置信息
   * @param {string} config.projectId - 项目ID
   * @param {string} config.topic - 蒸馆主题
   * @param {number} config.levels - 标签层级
   * @param {number} config.tagsPerLevel - 每层标签数量
   * @param {Object} config.model - 模型信息
   * @param {string} config.language - 语言
   * @param {Function} config.onProgress - 进度回调
   * @param {Function} config.onLog - 日志回调
   * @returns {Promise<void>}
   */
  async buildTagTree(config) {
    const { projectId, topic, levels, tagsPerLevel, model, language, onProgress, onLog } = config;

    // 使用已经获取的项目名称，如果未获取到，则使用主题
    const projectName = this.projectName || topic;

    // 递归构建标签树
    const buildTagsForLevel = async (parentTag = null, parentTagPath = '', level = 1) => {
      // 设置当前阶段
      if (onProgress) {
        onProgress({
          stage: `level${level}`
        });
      }

      // 如果已经达到目标层级，停止递归
      if (level > levels) {
        return;
      }

      // 获取当前级别的标签
      let currentLevelTags = [];
      try {
        // 获取所有标签，然后根据父标签ID进行过滤
        const response = await axios.get(`/api/projects/${projectId}/distill/tags/all`);

        // 如果有父标签，过滤出当前父标签下的子标签
        if (parentTag) {
          currentLevelTags = response.data.filter(tag => tag.parentId === parentTag.id);
        } else {
          // 如果没有父标签，则获取所有根标签（没有parentId的标签）
          currentLevelTags = response.data.filter(tag => !tag.parentId);
        }
      } catch (error) {
        console.error(`获取${level}级标签失败:`, error);
        this.addLog(onLog, `Failed to get ${level} level tags: ${error.message}`);
        return;
      }

      // 计算需要创建的标签数量
      const targetCount = tagsPerLevel;
      const currentCount = currentLevelTags.length;
      const needToCreate = Math.max(0, targetCount - currentCount);

      // 如果需要创建标签
      if (needToCreate > 0) {
        // 如果是第一级标签，使用配置中的主题名称
        const parentTagName = level === 1 ? topic : parentTag?.label || '';

        this.addLog(onLog, `Tag tree level ${level}: Creating ${tagsPerLevel} subtags for "${parentTagName}"...`);

        // 构建标签路径，确保以项目名称开头
        let tagPathWithProjectName;
        if (level === 1) {
          // 如果是第一级，使用项目名称
          tagPathWithProjectName = projectName;
        } else {
          // 如果不是第一级，确保标签路径以项目名称开头
          if (!parentTagPath) {
            tagPathWithProjectName = projectName;
          } else if (!parentTagPath.startsWith(projectName)) {
            tagPathWithProjectName = `${projectName} > ${parentTagPath}`;
          } else {
            tagPathWithProjectName = parentTagPath;
          }
        }

        try {
          const response = await axios.post(`/api/projects/${projectId}/distill/tags`, {
            parentTag: parentTagName,
            parentTagId: parentTag ? parentTag.id : null,
            tagPath: tagPathWithProjectName || parentTagName,
            count: needToCreate,
            model,
            language
          });

          // 更新构建的标签数量
          if (onProgress) {
            onProgress({
              tagsBuilt: response.data.length,
              updateType: 'increment'
            });
          }

          // 添加日志
          this.addLog(
            onLog,
            `Successfully created ${response.data.length} tags: ${response.data.map(tag => tag.label).join(', ')}`
          );

          // 将新创建的标签添加到当前级别标签列表中
          currentLevelTags = [...currentLevelTags, ...response.data];
        } catch (error) {
          console.error(`创建${level}级标签失败:`, error);
          this.addLog(onLog, `Failed to create ${level} level tags: ${error.message || 'Unknown error'}`);
        }
      }

      // 如果不是最后一层，继续递归构建下一层标签
      if (level < levels) {
        for (const tag of currentLevelTags) {
          // 构建标签路径，确保以项目名称开头
          let tagPath;
          if (parentTagPath) {
            tagPath = `${parentTagPath} > ${tag.label}`;
          } else {
            tagPath = `${projectName} > ${tag.label}`;
          }

          // 递归构建子标签
          await buildTagsForLevel(tag, tagPath, level + 1);
        }
      }
    };

    // 获取叶子节点总数，更新进度条
    const leafTags = Math.pow(tagsPerLevel, levels);
    if (onProgress) {
      onProgress({
        tagsTotal: leafTags
      });
    }

    // 从第一层开始构建标签树
    await buildTagsForLevel();
  }

  /**
   * 为标签生成问题
   * @param {Object} config - 配置信息
   * @param {string} config.projectId - 项目ID
   * @param {number} config.levels - 标签层级
   * @param {number} config.questionsPerTag - 每个标签问题数量
   * @param {Object} config.model - 模型信息
   * @param {string} config.language - 语言
   * @param {Function} config.onProgress - 进度回调
   * @param {Function} config.onLog - 日志回调
   * @returns {Promise<void>}
   */
  async generateQuestionsForTags(config) {
    const { projectId, levels, questionsPerTag, model, language, concurrencyLimit = 5, onProgress, onLog } = config;

    // 设置当前阶段
    if (onProgress) {
      onProgress({
        stage: 'questions'
      });
    }

    this.addLog(onLog, 'Tag tree built, starting to generate questions for leaf tags...');

    try {
      // 获取所有标签
      const response = await axios.get(`/api/projects/${projectId}/distill/tags/all`);
      const allTags = response.data;

      // 找出所有叶子标签(没有子标签的标签)
      const leafTags = [];

      // 创建一个映射表，记录每个标签的子标签
      const childrenMap = {};
      allTags.forEach(tag => {
        if (tag.parentId) {
          if (!childrenMap[tag.parentId]) {
            childrenMap[tag.parentId] = [];
          }
          childrenMap[tag.parentId].push(tag);
        }
      });

      // 找出所有叶子标签
      allTags.forEach(tag => {
        // 如果没有子标签，并且深度是最大层级，则为叶子标签
        if (!childrenMap[tag.id] && this.getTagDepth(tag, allTags) === levels) {
          leafTags.push(tag);
        }
      });

      this.addLog(onLog, `Found ${leafTags.length} leaf tags, starting to generate questions...`);

      // 获取所有问题
      const questionsResponse = await axios.get(`/api/projects/${projectId}/questions/tree?isDistill=true`);
      const allQuestions = questionsResponse.data;

      // 更新总问题数量
      const totalQuestionsToGenerate = leafTags.length * questionsPerTag;
      if (onProgress) {
        onProgress({
          questionsTotal: totalQuestionsToGenerate
        });
      }

      // 准备并发任务
      const generateQuestionTasks = [];
      const processedTags = [];

      // 准备所有需要生成问题的叶子标签任务
      for (const tag of leafTags) {
        // 获取标签路径
        const tagPath = this.getTagPath(tag, allTags);

        // 计算已有问题数量
        const existingQuestions = allQuestions.filter(q => q.label === tag.label);
        const needToCreate = Math.max(0, questionsPerTag - existingQuestions.length);

        if (needToCreate > 0) {
          // 只添加需要生成问题的标签任务
          generateQuestionTasks.push({
            tag,
            tagPath,
            needToCreate
          });

          this.addLog(onLog, `Preparing to generate ${needToCreate} questions for tag "${tag.label}"...`);
        } else {
          this.addLog(
            onLog,
            `Tag "${tag.label}" already has ${existingQuestions.length} questions, no need to generate new questions`
          );
        }
      }

      // 分批执行生成问题任务，控制并发数
      this.addLog(
        onLog,
        `Total ${generateQuestionTasks.length} tags need questions, concurrency limit: ${concurrencyLimit}`
      );

      // 使用分组批量处理
      for (let i = 0; i < generateQuestionTasks.length; i += concurrencyLimit) {
        const batch = generateQuestionTasks.slice(i, i + concurrencyLimit);

        // 并行处理批次任务
        await Promise.all(
          batch.map(async task => {
            const { tag, tagPath, needToCreate } = task;

            this.addLog(onLog, `Generating ${needToCreate} questions for tag "${tag.label}"...`);

            try {
              const response = await axios.post(`/api/projects/${projectId}/distill/questions`, {
                tagPath,
                currentTag: tag.label,
                tagId: tag.id,
                count: needToCreate,
                model,
                language
              });

              // 更新生成的问题数量
              if (onProgress) {
                onProgress({
                  questionsBuilt: response.data.length,
                  updateType: 'increment'
                });
              }

              const questions = response.data
                .map(r => r.question || r.content)
                .slice(0, 3)
                .join('\n'); // 只显示前3个问题以避免日志过长
              this.addLog(onLog, `Successfully generated ${response.data.length} questions for tag "${tag.label}"`);
            } catch (error) {
              console.error(`为标签 "${tag.label}" 生成问题失败:`, error);
              this.addLog(
                onLog,
                `Failed to generate questions for tag "${tag.label}": ${error.message || 'Unknown error'}`
              );
            }
          })
        );

        // 每完成一批，输出一次进度日志
        this.addLog(
          onLog,
          `Completed batch ${Math.min(i + concurrencyLimit, generateQuestionTasks.length)}/${generateQuestionTasks.length} of question generation`
        );
      }
    } catch (error) {
      console.error('获取标签失败:', error);
      this.addLog(onLog, `Failed to get tags: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * 为问题生成数据集
   * @param {Object} config - 配置信息
   * @param {string} config.projectId - 项目ID
   * @param {Object} config.model - 模型信息
   * @param {string} config.language - 语言
   * @param {Function} config.onProgress - 进度回调
   * @param {Function} config.onLog - 日志回调
   * @returns {Promise<void>}
   */
  async generateDatasetsForQuestions(config) {
    const { projectId, model, language, concurrencyLimit = 5, onProgress, onLog } = config;

    // 设置当前阶段
    if (onProgress) {
      onProgress({
        stage: 'datasets'
      });
    }

    this.addLog(onLog, 'Question generation completed, starting to generate answers...');

    try {
      // 获取所有问题
      const response = await axios.get(`/api/projects/${projectId}/questions/tree?isDistill=true`);
      const allQuestions = response.data;

      // 找出未回答的问题
      const unansweredQuestions = allQuestions.filter(q => !q.answered);
      const answeredQuestions = allQuestions.filter(q => q.answered);

      // 更新总数据集数量和已生成数量
      if (onProgress) {
        onProgress({
          datasetsTotal: allQuestions.length, // 总数据集数量应为总问题数量
          datasetsBuilt: answeredQuestions.length // 已生成的数据集数量即已回答的问题数量
        });
      }

      this.addLog(onLog, `Found ${unansweredQuestions.length} unanswered questions, preparing to generate answers...`);
      this.addLog(onLog, `Dataset generation concurrency limit: ${concurrencyLimit}`);

      // 分批处理未回答的问题，控制并发数
      for (let i = 0; i < unansweredQuestions.length; i += concurrencyLimit) {
        const batch = unansweredQuestions.slice(i, i + concurrencyLimit);

        // 并行处理批次任务
        await Promise.all(
          batch.map(async question => {
            const questionContent = `${question.label} 下的问题ID:${question.id}`;
            this.addLog(onLog, `Generating answer for "${questionContent}"...`);

            try {
              // 调用生成数据集的函数
              await this.generateSingleDataset({
                projectId,
                questionId: question.id,
                questionInfo: question,
                model,
                language
              });

              // 更新生成的数据集数量
              if (onProgress) {
                onProgress({
                  datasetsBuilt: 1,
                  updateType: 'increment'
                });
              }

              this.addLog(onLog, `Successfully generated answer for question "${questionContent}"`);
            } catch (error) {
              console.error(`Failed to generate dataset for question "${question.id}":`, error);
              this.addLog(
                onLog,
                `Failed to generate answer for question "${questionContent}": ${error.message || 'Unknown error'}`
              );
            }
          })
        );

        // 每完成一批，输出一次进度日志
        this.addLog(
          onLog,
          `Completed batch ${Math.min(i + concurrencyLimit, unansweredQuestions.length)}/${unansweredQuestions.length} of dataset generation`
        );
      }
    } catch (error) {
      console.error('Failed to get questions:', error);
      this.addLog(onLog, `Failed to get questions: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * 生成单个数据集
   * @param {Object} config - 配置信息
   * @param {string} config.projectId - 项目ID
   * @param {string} config.questionId - 问题ID
   * @param {Object} config.questionInfo - 问题信息
   * @param {Object} config.model - 模型信息
   * @param {string} config.language - 语言
   * @returns {Promise<Object>} - 数据集信息
   */
  async generateSingleDataset({ projectId, questionId, questionInfo, model, language }) {
    try {
      // 构建请求参数
      const params = {
        model,
        language: language || 'zh-CN'
      };

      // 获取问题信息
      let question = questionInfo;
      if (!question) {
        const response = await axios.get(`/api/projects/${projectId}/questions/${questionId}`);
        question = response.data;
      }

      // 生成数据集
      const response = await axios.post(`/api/projects/${projectId}/datasets`, {
        projectId,
        questionId,
        model,
        language: language || 'zh-CN'
      });

      return response.data;
    } catch (error) {
      console.error('Failed to generate dataset:', error);
      throw new Error(`Failed to generate dataset: ${error.message}`);
    }
  }

  /**
   * 获取标签深度
   * @param {Object} tag - 标签信息
   * @param {Array} allTags - 所有标签
   * @returns {number} - 标签深度
   */
  getTagDepth(tag, allTags) {
    let depth = 1;
    let currentTag = tag;

    while (currentTag.parentId) {
      depth++;
      currentTag = allTags.find(t => t.id === currentTag.parentId);
      if (!currentTag) break;
    }

    return depth;
  }

  /**
   * 获取标签路径
   * @param {Object} tag - 标签信息
   * @param {Array} allTags - 所有标签
   * @returns {string} - 标签路径
   */
  /**
   * 获取标签路径，确保始终以项目名称开头
   * @param {Object} tag - 标签对象
   * @param {Array} allTags - 所有标签数组
   * @returns {string} 标签路径
   */
  getTagPath(tag, allTags) {
    // 使用已经获取的项目名称
    const projectName = this.projectName || '';

    // 构建标签路径
    const path = [];
    let currentTag = tag;

    while (currentTag) {
      path.unshift(currentTag.label);
      if (currentTag.parentId) {
        currentTag = allTags.find(t => t.id === currentTag.parentId);
      } else {
        currentTag = null;
      }
    }

    // 确保路径以项目名称开头
    if (projectName && path.length > 0 && path[0] !== projectName) {
      path.unshift(projectName);
    }

    return path.join(' > ');
  }

  /**
   * 添加日志
   * @param {Function} onLog - 日志回调
   * @param {string} message - 日志消息
   */
  addLog(onLog, message) {
    if (onLog && typeof onLog === 'function') {
      onLog(message);
    }
  }
}

export const autoDistillService = new AutoDistillService();
export default autoDistillService;
