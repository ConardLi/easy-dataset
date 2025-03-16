/**
 * 封装的通用重试函数，用于在操作失败后自动重试
 * @param {Function} asyncOperation - 需要执行的异步操作函数
 * @param {Object} options - 配置选项
 * @param {number} options.retries - 重试次数，默认为1
 * @param {number} options.delay - 重试前的延迟时间(毫秒)，默认为0
 * @param {Function} options.onRetry - 重试前的回调函数，接收错误和当前重试次数作为参数
 * @returns {Promise} - 返回异步操作的结果
 */
export const withRetry = async (asyncOperation, options = {}) => {
    const { retries = 1, delay = 0, onRetry = null } = options;
    let lastError;

    // 尝试执行操作，包括初次尝试和后续重试
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await asyncOperation();
        } catch (error) {
            lastError = error;

            // 如果这是最后一次尝试，则不再重试
            if (attempt === retries) {
                break;
            }

            // 如果提供了重试回调，则执行
            if (onRetry && typeof onRetry === 'function') {
                onRetry(error, attempt + 1);
            }

            // 如果设置了延迟，则等待指定时间
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // 如果所有尝试都失败，则抛出最后一个错误
    throw lastError;
};

/**
 * 封装的fetch函数，支持自动重试
 * @param {string} url - 请求URL
 * @param {Object} options - fetch选项
 * @param {Object} retryOptions - 重试选项
 * @returns {Promise} - 返回fetch响应
 */
export const fetchWithRetry = async (url, options = {}, retryOptions = {}) => {
    return withRetry(
        () => fetch(url, options),
        retryOptions
    );
};

export default fetchWithRetry;