import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 加密算法配置
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // GCM 推荐使用 12 字节，但为了兼容性使用 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // AES-256 需要 32 字节密钥

/**
 * 获取加密密钥
 * 优先级：
 * 1. 环境变量 ENCRYPTION_KEY
 * 2. 配置文件 .encryption-key（如果存在）
 * 3. 生成新密钥（首次使用）
 * 
 * @returns {string} 加密密钥（base64 格式）
 */
function getEncryptionKey() {
  // 优先从环境变量获取
  if (process.env.ENCRYPTION_KEY) {
    return process.env.ENCRYPTION_KEY;
  }

  // 从配置文件获取
  const keyFilePath = path.join(process.cwd(), '.encryption-key');

  if (fs.existsSync(keyFilePath)) {
    try {
      const key = fs.readFileSync(keyFilePath, 'utf-8').trim();
      if (key && key.length > 0) {
        return key;
      }
    } catch (error) {
      console.error('Error reading encryption key file:', error);
    }
  }

  // 如果都不存在，生成新密钥
  console.warn('⚠️  Encryption key not found. Generating a new key...');
  const newKey = generateEncryptionKey();
  
  // 保存到配置文件
  try {
    fs.writeFileSync(keyFilePath, newKey, { mode: 0o600 }); // 只允许所有者读写
    console.log('✅ Encryption key generated and saved to .encryption-key');
    console.log('⚠️  IMPORTANT: Backup this key file securely!');
    return newKey;
  } catch (error) {
    console.error('Error saving encryption key:', error);
    throw new Error('Failed to generate encryption key');
  }
}

/**
 * 生成新的加密密钥
 * @returns {string} base64 编码的密钥
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * 从 base64 密钥派生实际加密密钥
 * @param {string} base64Key - base64 编码的密钥
 * @returns {Buffer} 加密密钥
 */
function deriveKey(base64Key) {
  // 如果密钥长度不够，使用 PBKDF2 派生
  const keyBuffer = Buffer.from(base64Key, 'base64');
  if (keyBuffer.length >= KEY_LENGTH) {
    return keyBuffer.slice(0, KEY_LENGTH);
  }
  
  // 使用 PBKDF2 派生密钥
  return crypto.pbkdf2Sync(
    base64Key,
    'encryption-salt', // 固定盐值（因为密钥本身已经足够随机）
    100000, // 迭代次数
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * 加密文本
 * @param {string} text - 要加密的文本
 * @returns {string} 加密后的字符串（格式：iv:tag:encryptedData，都是 base64）
 */
export function encrypt(text) {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    const key = deriveKey(getEncryptionKey());
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const tag = cipher.getAuthTag();
    
    // 返回格式：iv:tag:encryptedData（都是 base64）
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * 解密文本
 * @param {string} encryptedText - 加密的文本（格式：iv:tag:encryptedData）
 * @returns {string} 解密后的文本
 */
export function decrypt(encryptedText) {
  if (!encryptedText || encryptedText.trim() === '') {
    return '';
  }

  try {
    // 检查是否是旧格式（未加密的明文）
    if (!encryptedText.includes(':')) {
      // 可能是旧数据，直接返回（向后兼容）
      console.warn('⚠️  Detected unencrypted data, returning as-is');
      return encryptedText;
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivBase64, tagBase64, encrypted] = parts;
    const key = deriveKey(getEncryptionKey());
    const iv = Buffer.from(ivBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // 如果解密失败，可能是旧数据，尝试直接返回
    if (error.message.includes('Invalid encrypted data format')) {
      throw error;
    }
    console.warn('⚠️  Decryption failed, returning original value (may be unencrypted)');
    return encryptedText;
  }
}

/**
 * 检查文本是否已加密
 * @param {string} text - 要检查的文本
 * @returns {boolean} 是否已加密
 */
export function isEncrypted(text) {
  if (!text || text.trim() === '') {
    return false;
  }
  // 加密后的格式：iv:tag:encryptedData（三个部分用冒号分隔）
  const parts = text.split(':');
  return parts.length === 3;
}

