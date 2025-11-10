# API Key 加密存储方案

## 概述

为了增强安全性，所有模型配置的 API Key 现在都使用 **AES-256-GCM** 加密算法进行加密存储。

## 安全特性

### 1. 加密算法
- **算法**: AES-256-GCM（高级加密标准，256位密钥，Galois/Counter Mode）
- **密钥长度**: 256 位（32 字节）
- **IV 长度**: 16 字节（随机生成，每次加密都不同）
- **认证标签**: 16 字节（防止数据被篡改）

### 2. 密钥管理

加密密钥的获取优先级：

1. **环境变量** `ENCRYPTION_KEY`（推荐用于生产环境）
2. **配置文件** `.encryption-key`（开发环境）
3. **自动生成**（首次使用时自动生成）

### 3. 存储格式

加密后的数据格式：`iv:tag:encryptedData`（所有部分都是 base64 编码）

- `iv`: 初始化向量（每次加密都不同）
- `tag`: 认证标签（用于验证数据完整性）
- `encryptedData`: 加密后的数据

## 使用方法

### 初始化加密密钥

#### 方法 1: 使用脚本生成（推荐）

```bash
npm run generate-encryption-key
```

这会生成一个新的加密密钥并保存到 `.encryption-key` 文件。

#### 方法 2: 使用环境变量（生产环境推荐）

```bash
# 生成密钥
export ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# 或者在 .env 文件中添加
echo "ENCRYPTION_KEY=your_generated_key_here" >> .env
```

### 密钥文件权限

`.encryption-key` 文件会自动设置为 `600` 权限（只允许所有者读写），确保安全性。

## 安全最佳实践

### 1. 密钥备份

⚠️ **重要**: 必须安全备份加密密钥！

- 如果丢失密钥，**无法恢复**已加密的 API Key
- 建议使用密码管理器（如 1Password、LastPass）备份密钥
- 不要将密钥提交到代码仓库

### 2. 生产环境部署

**推荐方案**：使用环境变量

```bash
# 在服务器上设置环境变量
export ENCRYPTION_KEY="your_production_key_here"

# 或使用 Docker
docker run -e ENCRYPTION_KEY="your_production_key_here" ...

# 或使用 Kubernetes Secret
kubectl create secret generic encryption-key --from-literal=key="your_production_key_here"
```

### 3. 密钥轮换

如果需要更换加密密钥：

1. 备份当前密钥
2. 解密所有现有的 API Key
3. 生成新密钥
4. 使用新密钥重新加密所有 API Key

```bash
# 1. 备份旧密钥
cp .encryption-key .encryption-key.backup

# 2. 设置新密钥
export ENCRYPTION_KEY="new_key_here"

# 3. 重新保存所有模型配置（会自动使用新密钥加密）
# 在应用界面中，编辑并保存每个模型配置
```

## 向后兼容性

系统支持向后兼容：

- **已加密的数据**: 自动解密
- **未加密的数据**: 自动识别并直接返回（会显示警告）
- **迁移**: 下次保存时会自动加密

## 技术细节

### 加密流程

```
明文 API Key
    ↓
生成随机 IV
    ↓
使用 AES-256-GCM 加密
    ↓
生成认证标签
    ↓
组合: iv:tag:encryptedData
    ↓
存储到 .env 文件
```

### 解密流程

```
从 .env 文件读取
    ↓
解析: iv:tag:encryptedData
    ↓
使用密钥和 IV 解密
    ↓
验证认证标签
    ↓
返回明文 API Key
```

## 故障排除

### 问题 1: 解密失败

**症状**: `Decryption error` 或 `Invalid encrypted data format`

**可能原因**:
- 加密密钥不匹配
- 数据被损坏
- 使用了错误的密钥

**解决方案**:
1. 确认使用的是正确的加密密钥
2. 检查 `.encryption-key` 文件是否存在且正确
3. 检查环境变量 `ENCRYPTION_KEY` 是否正确设置

### 问题 2: 密钥文件权限问题

**症状**: `Error reading encryption key file`

**解决方案**:
```bash
chmod 600 .encryption-key
```

### 问题 3: 无法生成密钥

**症状**: `Failed to generate encryption key`

**解决方案**:
1. 检查文件系统权限
2. 确认有写入权限
3. 手动创建密钥文件：
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" > .encryption-key
   chmod 600 .encryption-key
   ```

## 安全建议

1. ✅ **使用强密钥**: 密钥应该是随机生成的，至少 32 字节
2. ✅ **定期备份**: 定期备份加密密钥到安全位置
3. ✅ **限制访问**: 确保只有授权人员可以访问密钥
4. ✅ **监控日志**: 监控加密/解密操作的日志
5. ✅ **密钥轮换**: 定期轮换加密密钥（如果可能）
6. ❌ **不要提交密钥**: 永远不要将密钥提交到版本控制系统
7. ❌ **不要共享密钥**: 不要通过不安全的方式共享密钥

## 相关文件

- `lib/util/crypto.js` - 加密/解密核心实现
- `lib/util/env-manager.js` - API Key 存储管理
- `.encryption-key` - 加密密钥文件（不应提交到 Git）
- `.gitignore` - 已包含 `.encryption-key`

