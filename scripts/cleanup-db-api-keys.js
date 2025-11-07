#!/usr/bin/env node

/**
 * 清理数据库中的 API Key 脚本
 * 
 * 此脚本会将数据库中的 apiKey 字段设置为 null
 * API Key 应该已经迁移到 .env 文件（加密存储）
 * 
 * 使用方法：
 * node scripts/cleanup-db-api-keys.js [--dry-run]
 * 
 * 选项：
 *   --dry-run: 只显示将要清理的数据，不实际执行
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupApiKeys() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  try {
    console.log('开始清理数据库中的 API Key...\n');

    if (isDryRun) {
      console.log('⚠️  DRY RUN 模式：只显示将要清理的数据，不会实际修改数据库\n');
    }

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
        providerName: true,
        projectId: true
      }
    });

    if (configs.length === 0) {
      console.log('✅ 数据库中没有需要清理的 API Key。');
      return;
    }

    console.log(`找到 ${configs.length} 个需要清理的模型配置：\n`);

    // 显示将要清理的数据
    configs.forEach((config, index) => {
      const maskedKey = config.apiKey 
        ? `${config.apiKey.substring(0, 8)}...${config.apiKey.substring(config.apiKey.length - 4)}`
        : 'null';
      console.log(`${index + 1}. ${config.providerName} - ${config.modelName}`);
      console.log(`   ID: ${config.id}`);
      console.log(`   API Key: ${maskedKey}`);
      console.log(`   Project ID: ${config.projectId}\n`);
    });

    if (isDryRun) {
      console.log('⚠️  DRY RUN 模式：以上数据不会被修改。');
      console.log('   要实际执行清理，请运行：node scripts/cleanup-db-api-keys.js\n');
      return;
    }

    // 确认操作
    console.log('⚠️  警告：此操作将清除数据库中的所有 API Key！');
    console.log('   请确保 API Key 已经迁移到 .env 文件（加密存储）。\n');
    console.log('   按 Ctrl+C 取消，或等待 5 秒后自动执行...\n');

    // 等待 5 秒
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 执行清理
    let successCount = 0;
    let errorCount = 0;

    for (const config of configs) {
      try {
        await prisma.modelConfig.update({
          where: { id: config.id },
          data: { apiKey: null }
        });
        console.log(`✅ 已清理 ${config.providerName} - ${config.modelName} (ID: ${config.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ 清理失败 ${config.providerName} - ${config.modelName} (ID: ${config.id}):`, error.message);
        errorCount++;
      }
    }

    console.log('\n清理完成！');
    console.log(`✅ 成功: ${successCount} 个`);
    console.log(`❌ 失败: ${errorCount} 个`);

    if (successCount > 0) {
      console.log('\n✅ 数据库中的 apiKey 字段已全部设置为 null。');
      console.log('   API Key 现在只存储在 .env 文件中（加密）。');
    }
  } catch (error) {
    console.error('清理过程中出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行清理
cleanupApiKeys();

