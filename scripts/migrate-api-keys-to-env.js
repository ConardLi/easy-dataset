/**
 * 迁移脚本：将数据库中的 API Key 迁移到 .env 文件
 * 
 * 使用方法：
 * node scripts/migrate-api-keys-to-env.js
 */

import { PrismaClient } from '@prisma/client';
import { saveModelApiKey } from '../lib/util/env-manager.js';

const prisma = new PrismaClient();

async function migrateApiKeys() {
  try {
    console.log('开始迁移 API Key 到 .env 文件...\n');

    // 查询所有有 apiKey 的模型配置
    const configs = await prisma.modelConfig.findMany({
      where: {
        apiKey: {
          not: null
        }
      },
      select: {
        id: true,
        apiKey: true,
        modelName: true,
        providerName: true
      }
    });

    if (configs.length === 0) {
      console.log('没有找到需要迁移的 API Key。');
      return;
    }

    console.log(`找到 ${configs.length} 个需要迁移的模型配置：\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const config of configs) {
      // 检查 .env 文件中是否已经存在
      const { getModelApiKey } = await import('../lib/util/env-manager.js');
      const existingKey = getModelApiKey(config.id);

      if (existingKey && existingKey.trim() !== '') {
        console.log(`⏭️  跳过 ${config.providerName} - ${config.modelName} (ID: ${config.id})`);
        console.log(`   原因: .env 文件中已存在 API Key\n`);
        skipCount++;
        continue;
      }

      // 迁移到 .env 文件
      const result = saveModelApiKey(config.id, config.apiKey);
      
      if (result) {
        console.log(`✅ 成功迁移 ${config.providerName} - ${config.modelName} (ID: ${config.id})`);
        console.log(`   API Key: ${config.apiKey.substring(0, 10)}...\n`);
        successCount++;
      } else {
        console.log(`❌ 迁移失败 ${config.providerName} - ${config.modelName} (ID: ${config.id})\n`);
      }
    }

    console.log('\n迁移完成！');
    console.log(`✅ 成功: ${successCount} 个`);
    console.log(`⏭️  跳过: ${skipCount} 个`);
    console.log(`❌ 失败: ${configs.length - successCount - skipCount} 个`);

    if (successCount > 0) {
      console.log('\n⚠️  注意：数据库中的 apiKey 字段仍然保留（向后兼容）。');
      console.log('   如果需要，可以手动将数据库中的 apiKey 字段设置为 NULL。');
    }
  } catch (error) {
    console.error('迁移过程中出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行迁移
migrateApiKeys();

