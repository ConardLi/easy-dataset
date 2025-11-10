# 用户体系说明文档

## 概述

系统已添加用户权限管理功能，实现了基于角色的访问控制（RBAC）：
- **管理员（admin）**：可以查看和管理所有用户的项目
- **普通用户（user）**：只能查看和管理自己的项目

## 数据库变更

### 新增表：Users

```prisma
model Users {
  id        String    @id @default(nanoid(12))
  username  String    @unique
  email     String?   @unique
  role      String    @default("user") // 'admin' | 'user'
  createAt  DateTime  @default(now())
  updateAt  DateTime  @updatedAt
  Projects  Projects[]
}
```

### Projects 表变更

在 `Projects` 表中新增了 `userId` 字段，用于关联项目所有者：

```prisma
model Projects {
  ...
  userId  String? // 升级阶段允许为空，初始化脚本会自动补齐
  user    Users? @relation(fields: [userId], references: [id], onDelete: Cascade)
  ...
}
```

## 初始化步骤

### 1. 更新数据库 Schema

运行 Prisma 迁移以更新数据库结构：

```bash
npx prisma migrate dev --name add_user_system
```

或者使用：

```bash
npx prisma db push
```

### 2. 初始化用户体系

首次部署或升级后，需要初始化用户体系。有两种方式：

#### 方式一：通过 API 初始化（推荐）

访问初始化接口：

```bash
curl -X POST http://localhost:1717/api/users/init
```

或者在浏览器中访问该接口。

#### 方式二：运行迁移脚本

```bash
node scripts/migrate-add-users.js
```

初始化操作会：
1. 创建默认用户（username: 'admin', password: 'hkgai@123456', role: 'admin'）
2. 将所有现有项目分配给默认用户
3. 设置当前会话为默认用户

## 用户管理

### 创建用户（仅管理员）

```bash
POST /api/users
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "role": "user"  // 或 "admin"
}
```

### 获取当前用户信息

```bash
GET /api/users
```

### 切换用户

通过设置 cookie `user_id` 来切换当前用户（需要实现前端登录界面）。

## 权限控制

### 项目访问权限

- **管理员**：可以访问所有项目
- **普通用户**：只能访问自己创建的项目

### API 权限检查

所有项目相关的 API 都会自动进行权限检查：

- `GET /api/projects` - 根据用户角色返回项目列表
- `POST /api/projects` - 创建的项目自动关联当前用户
- `GET /api/projects/[projectId]` - 检查项目访问权限
- `PUT /api/projects/[projectId]` - 检查项目修改权限
- `DELETE /api/projects/[projectId]` - 检查项目删除权限

### 在代码中使用权限检查

```javascript
import { getCurrentUserId, checkIsAdmin, canAccessProject } from '@/lib/auth';
import { checkProjectAccess } from '@/lib/auth/project-auth';

// 检查当前用户是否为管理员
const isAdmin = await checkIsAdmin();

// 检查是否有权限访问项目
const hasAccess = await canAccessProject(projectUserId);

// 检查项目访问权限（包含项目信息）
const { hasAccess, project, error } = await checkProjectAccess(projectId);
if (!hasAccess) {
  return Response.json({ error }, { status: 403 });
}
```

## 迁移现有数据

如果系统中有现有项目，运行初始化脚本会自动：

1. 创建默认管理员用户
2. 将所有现有项目的 `userId` 设置为默认用户ID
3. 确保所有项目都有所有者

## 注意事项

1. **默认用户**：系统使用 `'admin'` 作为默认管理员账号，默认密码为 `hkgai@123456`
2. **Cookie 管理**：用户ID存储在 HTTP-only cookie 中，确保安全性
3. **向后兼容**：如果未设置用户ID，系统会使用默认用户，确保现有功能正常工作
4. **项目名称唯一性**：项目名称在同一用户下必须唯一，不同用户可以创建同名项目

## 后续开发建议

1. **登录界面**：实现用户登录/注册界面
2. **用户切换**：在设置中添加用户切换功能
3. **权限管理界面**：为管理员提供用户管理界面
4. **会话管理**：实现更完善的会话管理机制

## 故障排查

### 问题：无法访问项目

**原因**：项目不属于当前用户，且当前用户不是管理员

**解决**：
1. 检查当前用户ID：`GET /api/users`
2. 确认项目所有者：查看项目的 `userId` 字段
3. 如果是管理员，确保 `role` 字段为 `'admin'`

### 问题：创建项目失败

**原因**：可能是用户ID未正确设置

**解决**：
1. 运行初始化脚本：`POST /api/users/init`
2. 检查用户是否存在：查看 `Users` 表

### 问题：数据库迁移失败

**原因**：可能是现有数据与新的 schema 冲突

**解决**：
1. 备份数据库
2. 手动为现有项目添加 `userId` 字段
3. 运行初始化脚本分配默认用户
