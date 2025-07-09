import { defaultProcessing } from './default';
import { minerUProcessing } from './mineru';
import { visionProcessing } from './vision';
import { minerULocalProcessing } from './mineru-local';

/**
 * PDF处理服务入口
 * @param {string} projectId 项目ID
 * @param {string} fileName 文件名
 * @param {Object} options 处理选项
 * @param {string} strategy 处理策略，可选值: 'default', 'mineru', 'vision'
 * @returns {Promise<Object>} 处理结果
 */
export async function processPdf(strategy = 'default', projectId, fileName, options = {}) {
  switch (strategy.toLowerCase()) {
    case 'default':
      return await defaultProcessing(projectId, fileName, options);
    case 'mineru':
      return await minerUProcessing(projectId, fileName, options);
    case 'vision':
      return await visionProcessing(projectId, fileName, options);
    case 'mineru-local':
      return await minerULocalProcessing(projectId, fileName, options);
    default:
      throw new Error(`unsupported PDF processing strategy: ${strategy}`);
  }
}

export default {
  processPdf
};

export * from './util';
