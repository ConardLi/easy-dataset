# API Key 迁移到 .env 文件说明

## 概述

从本次更新开始，模型配置的 API Key（token）将不再存储在数据库中，而是存储在 `.env` 文件中，以提高安全性。

## 变更内容

1. **数据库 Schema 变更**
   - `ModelConfig` 表的 `apiKey` 字段改为可选字段（`String?`）
   - 实际 API Key 存储在 `.env` 文件中，格式：`MODEL_CONFIG_{modelConfigId}_API_KEY=your_api_key`

2. **代码变更**
   - 新增 `lib/util/env-manager.js` 工具函数，用于管理 .env 文件
   - 更新 `lib/db/model-config.js`，自动处理 .env 文件的读写
   - 保存时：API Key 写入 .env 文件，数据库不存储
   - 读取时：从 .env 文件读取 API Key 并添加到返回结果中

## 迁移步骤

### 1. 运行数据库迁移

```bash
# 更新数据库 schema
npm run db:push
```

### 2. 迁移现有数据（推荐）

如果你有现有的模型配置数据，需要将 API Key 从数据库迁移到 .env 文件：

```bash
# 运行迁移脚本（会自动将数据库中的 API Key 迁移到 .env 文件）
npm run migrate-api-keys
```

迁移脚本会：
- 查找所有数据库中有 apiKey 的模型配置
- 将 apiKey 保存到 .env 文件（格式：`MODEL_CONFIG_{modelConfigId}_API_KEY=your_api_key`）
- 如果 .env 文件中已存在，则跳过（不会覆盖）
- 显示迁移进度和结果

**注意**：迁移后，数据库中的 apiKey 字段仍然保留（向后兼容）。代码会优先使用 .env 文件中的值，如果 .env 中没有，才会使用数据库中的值。

### 3. 验证

1. 启动应用
2. 进入模型设置页面
3. 检查现有模型配置的 API Key 是否正常显示
4. 尝试编辑并保存模型配置，确认 API Key 正确保存

## 注意事项

1. **.env 文件安全**
   - `.env` 文件已在 `.gitignore` 中，不会被提交到版本控制
   - 请确保不要将 `.env` 文件提交到 Git 仓库
   - 在生产环境中，建议使用环境变量管理服务（如 AWS Secrets Manager、Azure Key Vault 等）

2. **备份**
   - 迁移前请备份数据库
   - 迁移后请备份 `.env` 文件

3. **兼容性**
   - 新代码会优先从 .env 文件读取 API Key
   - 如果 .env 文件中没有，会回退到数据库中的值（向后兼容）
   - 建议尽快将所有 API Key 迁移到 .env 文件

## 环境变量格式

在 `.env` 文件中，每个模型配置的 API Key 使用以下格式：

```
MODEL_CONFIG_{modelConfigId}_API_KEY=your_api_key_here
```

例如：
```
MODEL_CONFIG_abc123_API_KEY=sk-1234567890abcdef
MODEL_CONFIG_def456_API_KEY=your-zhipu-api-key
```

## 回滚（如果需要）

如果需要回滚到数据库存储方式：

1. 恢复数据库 schema（将 `apiKey` 改回 `String`）
2. 从 .env 文件读取所有 API Key 并写回数据库
3. 恢复旧版本的代码

