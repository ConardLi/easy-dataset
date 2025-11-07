#!/usr/bin/env node

/**
 * 生成加密密钥工具
 * 
 * 使用方法：
 * node scripts/generate-encryption-key.js
 * 
 * 或者设置环境变量：
 * export ENCRYPTION_KEY=$(node scripts/generate-encryption-key.js)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * 生成新的加密密钥
 * @returns {string} base64 编码的密钥
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('base64');
}

const keyFilePath = path.join(process.cwd(), '.encryption-key');

// 检查是否已存在密钥文件
if (fs.existsSync(keyFilePath)) {
  console.log('⚠️  Encryption key file already exists!');
  console.log(`   Location: ${keyFilePath}`);
  console.log('\n   If you want to generate a new key:');
  console.log('   1. Backup the existing key file');
  console.log('   2. Delete .encryption-key');
  console.log('   3. Run this script again');
  process.exit(1);
}

// 生成新密钥
const key = generateEncryptionKey();

// 保存到文件
try {
  fs.writeFileSync(keyFilePath, key, { mode: 0o600 }); // 只允许所有者读写
  console.log('✅ Encryption key generated successfully!');
  console.log(`\n📁 Key saved to: ${keyFilePath}`);
  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('   1. Backup this key file securely (e.g., password manager)');
  console.log('   2. Never commit this file to version control');
  console.log('   3. Keep it safe - losing it means losing access to encrypted data');
  console.log('   4. For production, consider using environment variable ENCRYPTION_KEY');
  console.log('\n💡 To use environment variable instead:');
  console.log(`   export ENCRYPTION_KEY="${key}"`);
  console.log('\n🔑 Generated key (base64):');
  console.log(key);
} catch (error) {
  console.error('❌ Error saving encryption key:', error);
  process.exit(1);
}

