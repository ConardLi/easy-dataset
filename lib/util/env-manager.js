import fs from 'fs';
import path from 'path';
import { encrypt, decrypt, isEncrypted } from './crypto.js';

const ENV_FILE_PATH = path.join(process.cwd(), '.env');

/**
 * 读取 .env 文件内容
 * @returns {Object} 环境变量对象
 */
export function readEnvFile() {
  try {
    if (!fs.existsSync(ENV_FILE_PATH)) {
      // 如果文件不存在，创建一个空的 .env 文件
      fs.writeFileSync(ENV_FILE_PATH, '', 'utf-8');
      return {};
    }
    const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    const env = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // 跳过空行和注释
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      // 解析 KEY=VALUE 格式
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // 移除引号
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    }
    return env;
  } catch (error) {
    console.error('Error reading .env file:', error);
    return {};
  }
}

/**
 * 写入 .env 文件
 * @param {Object} envVars - 环境变量对象
 */
export function writeEnvFile(envVars) {
  try {
    // 读取现有文件内容，保留注释和格式
    let existingContent = '';
    let existingComments = [];
    let existingLines = [];
    
    if (fs.existsSync(ENV_FILE_PATH)) {
      const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        // 保留注释和空行
        if (!trimmed || trimmed.startsWith('#')) {
          existingComments.push(line);
        } else {
          // 解析现有的环境变量
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            existingLines.push(line);
          } else {
            existingComments.push(line);
          }
        }
      }
    }
    
    // 读取现有的环境变量
    const existingEnv = readEnvFile();
    
    // 合并现有环境变量和新环境变量
    const mergedEnv = { ...existingEnv, ...envVars };
    
    // 构建新的文件内容
    const newLines = [];
    
    // 先写入注释和空行
    if (existingComments.length > 0) {
      newLines.push(...existingComments);
      if (!existingComments[existingComments.length - 1].trim()) {
        // 如果最后一行是空行，不需要再添加
      } else {
        newLines.push('');
      }
    }
    
    // 写入环境变量
    for (const [key, value] of Object.entries(mergedEnv)) {
      // 如果值包含空格或特殊字符，用引号包裹
      const formattedValue = value.includes(' ') || value.includes('=') 
        ? `"${value}"` 
        : value;
      newLines.push(`${key}=${formattedValue}`);
    }
    
    // 确保文件以换行符结尾
    const content = newLines.join('\n') + '\n';
    fs.writeFileSync(ENV_FILE_PATH, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing .env file:', error);
    return false;
  }
}

/**
 * 更新或添加单个环境变量
 * @param {string} key - 环境变量键
 * @param {string} value - 环境变量值
 */
export function setEnvVariable(key, value) {
  try {
    const existingEnv = readEnvFile();
    existingEnv[key] = value;
    return writeEnvFile(existingEnv);
  } catch (error) {
    console.error('Error setting env variable:', error);
    return false;
  }
}

/**
 * 获取环境变量值
 * @param {string} key - 环境变量键
 * @returns {string|undefined} 环境变量值
 */
export function getEnvVariable(key) {
  try {
    const env = readEnvFile();
    return env[key];
  } catch (error) {
    console.error('Error getting env variable:', error);
    return undefined;
  }
}

/**
 * 删除环境变量
 * @param {string} key - 环境变量键
 */
export function deleteEnvVariable(key) {
  try {
    const existingEnv = readEnvFile();
    delete existingEnv[key];
    return writeEnvFile(existingEnv);
  } catch (error) {
    console.error('Error deleting env variable:', error);
    return false;
  }
}

/**
 * 生成模型配置的 API Key 环境变量名
 * @param {string} modelConfigId - 模型配置 ID
 * @returns {string} 环境变量名
 */
export function getModelApiKeyEnvName(modelConfigId) {
  return `MODEL_CONFIG_${modelConfigId}_API_KEY`;
}

/**
 * 保存模型配置的 API Key 到 .env 文件（加密存储）
 * @param {string} modelConfigId - 模型配置 ID
 * @param {string} apiKey - API Key（明文）
 * @returns {boolean} 是否成功
 */
export function saveModelApiKey(modelConfigId, apiKey) {
  if (!modelConfigId) {
    console.warn('saveModelApiKey: modelConfigId is empty');
    return false;
  }
  
  const envName = getModelApiKeyEnvName(modelConfigId);
  
  if (!apiKey || apiKey.trim() === '') {
    // 如果 apiKey 为空，删除对应的环境变量
    console.log(`saveModelApiKey: Deleting env variable ${envName} for model ${modelConfigId}`);
    return deleteEnvVariable(envName);
  }
  
  // 加密 API Key
  try {
    const encryptedKey = encrypt(apiKey);
    console.log(`saveModelApiKey: Encrypting and saving API key for model ${modelConfigId} to ${envName}`);
    const result = setEnvVariable(envName, encryptedKey);
    if (result) {
      console.log(`saveModelApiKey: Successfully saved encrypted API key for model ${modelConfigId}`);
    } else {
      console.error(`saveModelApiKey: Failed to save API key for model ${modelConfigId}`);
    }
    return result;
  } catch (error) {
    console.error(`saveModelApiKey: Encryption failed for model ${modelConfigId}:`, error);
    return false;
  }
}

/**
 * 从 .env 文件读取模型配置的 API Key（自动解密）
 * @param {string} modelConfigId - 模型配置 ID
 * @returns {string} API Key（解密后的明文），如果不存在则返回空字符串
 */
export function getModelApiKey(modelConfigId) {
  if (!modelConfigId) {
    return '';
  }
  const envName = getModelApiKeyEnvName(modelConfigId);
  const encryptedKey = getEnvVariable(envName);
  
  if (!encryptedKey) {
    return '';
  }
  
  // 尝试解密
  try {
    // 检查是否已加密
    if (isEncrypted(encryptedKey)) {
      return decrypt(encryptedKey);
    } else {
      // 未加密的数据（向后兼容），直接返回
      console.warn(`⚠️  Unencrypted API key found for model ${modelConfigId}, consider re-saving to encrypt`);
      return encryptedKey;
    }
  } catch (error) {
    console.error(`getModelApiKey: Decryption failed for model ${modelConfigId}:`, error);
    // 解密失败时，尝试返回原始值（可能是旧数据）
    return encryptedKey;
  }
}

