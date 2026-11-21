/**
 * LLM 调用统计日志工具
 * 异步记录 LLM 调用的 Token 消耗、响应时间等指标
 */
import { db } from '@/lib/db/index';

/**
 * 获取当前日期字符串 (YYYY-MM-DD)
 */
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 异步记录 LLM 调用日志（不阻塞主流程）
 * @param {Object} params - 日志参数
 * @param {string} params.projectId - 项目 ID
 * @param {string} params.provider - 提供商名称
 * @param {string} params.model - 模型名称
 * @param {number} params.inputTokens - 输入 Token 数
 * @param {number} params.outputTokens - 输出 Token 数
 * @param {number} params.latency - 响应耗时（毫秒）
 * @param {string} params.status - 状态 ('SUCCESS' | 'FAILED')
 * @param {string} [params.errorMessage] - 错误信息（失败时填写）
 */
export async function logLlmUsage({
  projectId,
  provider,
  model,
  inputTokens = 0,
  outputTokens = 0,
  latency = 0,
  status = 'SUCCESS',
  errorMessage = null
}) {
  // 异步执行，不阻塞主流程
  setImmediate(async () => {
    try {
      await db.llmUsageLogs.create({
        data: {
          projectId: projectId || 'unknown',
          provider: provider || 'unknown',
          model: model || 'unknown',
          inputTokens: inputTokens || 0,
          outputTokens: outputTokens || 0,
          totalTokens: (inputTokens || 0) + (outputTokens || 0),
          latency: latency || 0,
          status: status || 'SUCCESS',
          errorMessage: errorMessage || null,
          dateString: getDateString()
        }
      });
    } catch (error) {
      // 静默失败，不影响主流程
      console.error('[LLM Usage Logger] Failed to log usage:', error.message);
    }
  });
}

// Batch evaluation writes usage after score transactions to avoid concurrent SQLite writers.
export async function logEvaluationUsage(entries) {
  try {
    for (let i = 0; i < entries.length; i += 50) {
      const data = entries.slice(i, i + 50).map(row => ({
        ...row,
        totalTokens: row.inputTokens + row.outputTokens,
        dateString: getDateString()
      }));
      await db.llmUsageLogs.createMany({ data });
    }
  } catch {
    console.error('[LLM Usage Logger] Failed to store evaluation usage');
  }
}

/**
 * 创建一个计时器，用于测量 LLM 调用耗时
 * @returns {Object} 计时器对象
 */
export function createLatencyTimer() {
  const startTime = Date.now();
  return {
    /**
     * 获取从开始到现在的耗时（毫秒）
     */
    getLatency() {
      return Date.now() - startTime;
    }
  };
}

/**
 * 从 LLM 响应中提取 Token 使用信息
 * @param {Object} response - LLM 响应对象
 * @returns {Object} Token 使用信息
 */
export function extractTokenUsage(response) {
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    // AI SDK 格式
    if (response?.usage) {
      inputTokens = response.usage.promptTokens || response.usage.prompt_tokens || 0;
      outputTokens = response.usage.completionTokens || response.usage.completion_tokens || 0;
    }
    // OpenAI 原生格式
    else if (response?.response?.body?.usage) {
      const usage = response.response.body.usage;
      inputTokens = usage.prompt_tokens || 0;
      outputTokens = usage.completion_tokens || 0;
    }
    // 其他格式尝试
    else if (response?.prompt_tokens !== undefined) {
      inputTokens = response.prompt_tokens || 0;
      outputTokens = response.completion_tokens || 0;
    }
  } catch (error) {
    console.error('[LLM Usage Logger] Failed to extract token usage:', error.message);
  }

  return { inputTokens, outputTokens };
}

/**
 * 包装 LLM 调用，自动记录统计信息
 * @param {Function} llmCall - LLM 调用函数
 * @param {Object} context - 上下文信息
 * @param {string} context.projectId - 项目 ID
 * @param {string} context.provider - 提供商名称
 * @param {string} context.model - 模型名称
 * @returns {Promise<any>} LLM 调用结果
 */
export async function withUsageLogging(llmCall, context) {
  const timer = createLatencyTimer();
  let response = null;
  let status = 'SUCCESS';
  let errorMessage = null;

  try {
    response = await llmCall();
    return response;
  } catch (error) {
    status = 'FAILED';
    errorMessage = error.message || String(error);
    throw error;
  } finally {
    const latency = timer.getLatency();
    const { inputTokens, outputTokens } = response ? extractTokenUsage(response) : { inputTokens: 0, outputTokens: 0 };

    logLlmUsage({
      projectId: context.projectId,
      provider: context.provider,
      model: context.model,
      inputTokens,
      outputTokens,
      latency,
      status,
      errorMessage
    });
  }
}

export default {
  logLlmUsage,
  createLatencyTimer,
  extractTokenUsage,
  withUsageLogging
};
