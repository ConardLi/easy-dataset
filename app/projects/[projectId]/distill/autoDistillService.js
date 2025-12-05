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
      datasetType = 'single-turn', // 新增数据集类型
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

      // 根据数据集类型生成不同类型的数据集
      if (datasetType === 'single-turn') {
        // 只生成单轮对话数据集
        await this.generateDatasetsForQuestions({
          projectId,
          model,
          language,
          concurrencyLimit,
          onProgress,
          onLog
        });
      } else if (datasetType === 'multi-turn') {
        // 只生成多轮对话数据集
        await this.generateMultiTurnDatasetsForQuestions({
          projectId,
          model,
          language,
          concurrencyLimit,
          onProgress,
          onLog
        });
      } else if (datasetType === 'both') {
        // 先生成单轮对话数据集
        await this.generateDatasetsForQuestions({
          projectId,
          model,
          language,
          concurrencyLimit,
          onProgress,
          onLog
        });
        // 再生成多轮对话数据集
        await this.generateMultiTurnDatasetsForQuestions({
          projectId,
          model,
          language,
          concurrencyLimit,
          onProgress,
          onLog
        });
      }

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

    try {
      // 设置初始阶段
      if (onProgress) {
        onProgress({
          stage: 'level1'
        });
      }

      // 获取所有现有标签
      let allTags = [];
      try {
        const response = await axios.get(`/api/projects/${projectId}/distill/tags/all`);
        allTags = response.data;
      } catch (error) {
        console.error('获取标签失败:', error);
        this.addLog(onLog, `Failed to get tags: ${error.message}`);
        return;
      }

      // 获取叶子节点总数，更新进度条
      const leafTags = Math.pow(tagsPerLevel, levels);
      if (onProgress) {
        onProgress({
          tagsTotal: leafTags
        });
      }

      // 批量构建标签树
      await this.batchBuildTagTree({
        projectId,
        topic,
        levels,
        tagsPerLevel,
        model,
        language,
        projectName,
        allTags,
        onProgress,
        onLog
      });
    } catch (error) {
      console.error('构建标签树失败:', error);
      this.addLog(onLog, `Failed to build tag tree: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量构建标签树
   * @param {Object} config - 配置信息
   * @returns {Promise<void>}
   */
  async batchBuildTagTree(config) {
    const { 
      projectId, 
      topic, 
      levels, 
      tagsPerLevel, 
      model, 
      language, 
      projectName, 
      allTags: initialTags,
      onProgress, 
      onLog 
    } = config;

    // 创建一个本地标签缓存，避免频繁请求服务器
    let allTags = [...initialTags];
    
    // 构建父子关系映射
    const childrenMap = {};
    const parentMap = {};
    allTags.forEach(tag => {
      parentMap[tag.id] = tag;
      if (tag.parentId) {
        if (!childrenMap[tag.parentId]) {
          childrenMap[tag.parentId] = [];
        }
        childrenMap[tag.parentId].push(tag);
      }
    });

    // 按层级分组标签，提高查找效率
    const tagsByLevel = {};
    allTags.forEach(tag => {
      const depth = this.getTagDepth(tag, parentMap);
      if (!tagsByLevel[depth]) {
        tagsByLevel[depth] = [];
      }
      tagsByLevel[depth].push(tag);
    });

    // 批量创建各层级标签
    for (let level = 1; level <= levels; level++) {
      // 设置当前阶段
      if (onProgress) {
        onProgress({
          stage: `level${level}`
        });
      }

      // 确定当前层级的父标签
      let parentTags = [];
      if (level === 1) {
        // 第一层标签没有父标签
        parentTags = [null];
      } else {
        // 获取上一层的标签作为父标签
        parentTags = tagsByLevel[level - 1] || [];
      }

      const batch = parentTags;
      const creationPromises = [];

      for (const parentTag of batch) {
        // 获取当前父标签下的子标签
        let currentLevelTags = [];
        if (parentTag) {
          currentLevelTags = childrenMap[parentTag.id] || [];
        } else {
          // 根标签（没有父标签的标签）
          currentLevelTags = allTags.filter(tag => !tag.parentId);
        }

        // 计算需要创建的标签数量
        const needToCreate = Math.max(0, tagsPerLevel - currentLevelTags.length);
        
        if (needToCreate > 0) {
          // 构建标签路径
          let tagPathWithProjectName;
          if (level === 1) {
            // 第一层使用项目名称
            tagPathWithProjectName = projectName;
          } else {
            // 其他层构建完整路径
            const parentTagName = parentTag?.label || '';
            const parentTagPath = this.getTagPath(parentTag, parentMap);
            
            if (!parentTagPath) {
              tagPathWithProjectName = projectName;
            } else if (!parentTagPath.startsWith(projectName)) {
              tagPathWithProjectName = `${projectName} > ${parentTagPath}`;
            } else {
              tagPathWithProjectName = parentTagPath;
            }
          }

          // 创建标签的Promise
          const createPromise = axios.post(`/api/projects/${projectId}/distill/tags`, {
            parentTag: level === 1 ? topic : parentTag?.label || '',
            parentTagId: parentTag ? parentTag.id : null,
            tagPath: tagPathWithProjectName || (level === 1 ? projectName : ''),
            count: needToCreate,
            model,
            language
          }).then(response => {
            // 更新本地标签缓存
            const newTags = response.data;
            allTags = [...allTags, ...newTags];
            
            // 更新父子关系映射
            if (parentTag) {
              if (!childrenMap[parentTag.id]) {
                childrenMap[parentTag.id] = [];
              }
              childrenMap[parentTag.id].push(...newTags);
            }
            
            // 更新父标签映射
            newTags.forEach(tag => {
              parentMap[tag.id] = tag;
            });
            
            // 更新层级分组
            if (!tagsByLevel[level]) {
              tagsByLevel[level] = [];
            }
            tagsByLevel[level].push(...newTags);

            // 更新构建的标签数量
            if (onProgress) {
              onProgress({
                tagsBuilt: newTags.length,
                updateType: 'increment'
              });
            }

            // 添加日志
            this.addLog(
              onLog,
              `Successfully created ${newTags.length} tags: ${newTags.map(tag => `"${tag.label}"`).join(', ')}`
            );

            return newTags;
          }).catch(error => {
            console.error(`创建${level}级标签失败:`, error);
            this.addLog(onLog, `Failed to create ${level} level tags: ${error.message || 'Unknown error'}`);
            return [];
          });

          creationPromises.push(createPromise);
        }
      }

      // 并行执行当前批次的所有创建任务
      await Promise.all(creationPromises);
    }
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
      const parentMap = {};
      allTags.forEach(tag => {
        parentMap[tag.id] = tag;
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
        if (!childrenMap[tag.id] && this.getTagDepth(tag, parentMap) === levels) {
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
        const tagPath = this.getTagPath(tag, parentMap);

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

      this.addLog(onLog, 'Dataset generation completed');
    } catch (error) {
      console.error('Dataset generation failed:', error);
      this.addLog(onLog, `Dataset generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * 为问题生成多轮对话数据集
   */
  async generateMultiTurnDatasetsForQuestions(config) {
    const { projectId, model, language, concurrencyLimit = 2, onProgress, onLog } = config;

    // 设置当前阶段
    if (onProgress) {
      onProgress({
        stage: 'multi-turn-datasets'
      });
    }

    this.addLog(onLog, 'Question generation completed, starting to generate multi-turn conversations...');

    try {
      // 获取项目的多轮对话配置
      const configResponse = await axios.get(`/api/projects/${projectId}/tasks`);
      const taskConfig = configResponse.data;

      const multiTurnConfig = {
        systemPrompt: taskConfig.multiTurnSystemPrompt || '',
        scenario: taskConfig.multiTurnScenario || '',
        rounds: taskConfig.multiTurnRounds || 3,
        roleA: taskConfig.multiTurnRoleA || '',
        roleB: taskConfig.multiTurnRoleB || ''
      };

      // 检查是否已配置必要的多轮对话设置
      if (
        !multiTurnConfig.scenario ||
        !multiTurnConfig.roleA ||
        !multiTurnConfig.roleB ||
        !multiTurnConfig.rounds ||
        multiTurnConfig.rounds < 1
      ) {
        throw new Error('项目未配置多轮对话参数，请先在项目设置中配置多轮对话相关参数');
      }

      // 获取所有已回答的问题（多轮对话需要基于已有答案的问题）
      const response = await axios.get(`/api/projects/${projectId}/questions/tree?isDistill=true`);
      const allQuestions = response.data;
      const answeredQuestions = allQuestions;

      if (answeredQuestions.length === 0) {
        this.addLog(onLog, 'No answered questions found, skipping multi-turn conversation generation');
        return;
      }

      // 获取已生成多轮对话的问题ID
      const conversationsResponse = await axios.get(`/api/projects/${projectId}/dataset-conversations?pageSize=1000`);
      const existingConversationIds = new Set(
        (conversationsResponse.data.conversations || []).map(conv => conv.questionId)
      );

      // 筛选未生成多轮对话的问题
      const questionsForMultiTurn = answeredQuestions.filter(q => !existingConversationIds.has(q.id));

      // 更新多轮对话数据集总数和已生成数量
      if (onProgress) {
        onProgress({
          multiTurnDatasetsTotal: answeredQuestions.length,
          multiTurnDatasetsBuilt: answeredQuestions.length - questionsForMultiTurn.length
        });
      }

      this.addLog(
        onLog,
        `Found ${questionsForMultiTurn.length} questions ready for multi-turn conversation generation...`
      );
      this.addLog(onLog, `Multi-turn generation concurrency limit: ${concurrencyLimit}`);

      // 分批处理未生成多轮对话的问题，控制并发数
      for (let i = 0; i < questionsForMultiTurn.length; i += concurrencyLimit) {
        const batch = questionsForMultiTurn.slice(i, i + concurrencyLimit);

        // 并行处理批次任务
        await Promise.all(
          batch.map(async question => {
            const questionContent = `${question.label} 下的问题ID:${question.id}`;
            this.addLog(onLog, `Generating multi-turn conversation for "${questionContent}"...`);

            try {
              // 调用生成多轮对话的函数
              await this.generateSingleMultiTurnDataset({
                projectId,
                questionId: question.id,
                questionInfo: question,
                model,
                language,
                multiTurnConfig
              });

              // 更新进度
              if (onProgress) {
                onProgress({
                  multiTurnDatasetsBuilt: 1,
                  updateType: 'increment'
                });
              }

              this.addLog(onLog, `Multi-turn conversation generated for "${questionContent}"`);
            } catch (error) {
              this.addLog(
                onLog,
                `Failed to generate multi-turn conversation for "${questionContent}": ${error.message}`
              );
            }
          })
        );
      }

      this.addLog(onLog, 'Multi-turn conversation generation completed');
    } catch (error) {
      console.error('Multi-turn dataset generation failed:', error);
      this.addLog(onLog, `Multi-turn dataset generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * 生成单个问题的多轮对话数据集
   */
  async generateSingleMultiTurnDataset({ projectId, questionId, questionInfo, model, language, multiTurnConfig }) {
    try {
      const response = await axios.post(`/api/projects/${projectId}/dataset-conversations`, {
        questionId,
        ...multiTurnConfig,
        model,
        language
      });

      return response.data;
    } catch (error) {
      console.error('Failed to generate multi-turn dataset:', error);
      throw new Error(`Failed to generate multi-turn dataset: ${error.message}`);
    }
  }

  /**
   * 生成单个问题的数据集
   */
  async generateSingleDataset({ projectId, questionId, questionInfo, model, language }) {
    try {
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
   * @param {Object} parentMap - 父标签映射
   * @returns {number} - 标签深度
   */
  getTagDepth(tag, parentMap) {
    if (!tag) return 0;
    
    let depth = 1;
    let currentTag = tag;

    while (currentTag && currentTag.parentId) {
      depth++;
      currentTag = parentMap[currentTag.parentId];
    }

    return depth;
  }

  /**
   * 获取标签路径，确保始终以项目名称开头
   * @param {Object|null} tag - 标签对象
   * @param {Object} parentMap - 父标签映射
   * @returns {string} 标签路径
   */
  getTagPath(tag, parentMap) {
    if (!tag) return '';
    
    // 使用已经获取的项目名称
    const projectName = this.projectName || '';

    // 构建标签路径
    const path = [];
    let currentTag = tag;

    while (currentTag) {
      path.unshift(currentTag.label);
      if (currentTag.parentId) {
        currentTag = parentMap[currentTag.parentId];
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
