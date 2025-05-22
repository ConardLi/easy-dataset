# Easy Dataset 部署指南

## 环境要求
- Node.js (推荐使用 LTS 版本)
- pnpm 包管理器
- Windows 操作系统

## 部署步骤

### 1. 清理环境（如果需要）
```powershell
# 删除现有的 node_modules 和 package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
```

### 2. 安装依赖
```powershell
# 使用 pnpm 安装项目依赖
pnpm install
```

### 3. 运行项目

#### 开发模式
```powershell
# 启动开发服务器（端口 1717）
pnpm dev
```

#### 生产模式
```powershell
# 构建项目
pnpm build

# 启动生产服务器（端口 1717）
pnpm start
```

#### Electron 桌面应用模式
```powershell
# 开发模式运行 Electron 应用
pnpm electron-dev

# 打包 Windows 版本
pnpm electron-build-win

# 打包 Mac 版本
pnpm electron-build-mac

# 打包 Linux 版本
pnpm electron-build-linux
```

## 项目目录结构
```
easy-dataset/
├── .git/                    # Git 版本控制目录
├── .github/                 # GitHub 配置文件
├── .husky/                  # Git hooks 配置
├── app/                     # Next.js 应用主目录
├── components/              # React 组件
├── constant/                # 常量定义
├── electron/                # Electron 相关代码
├── hooks/                   # React Hooks
├── lib/                     # 工具库
├── locales/                 # 国际化文件
├── prisma/                  # 数据库配置
├── public/                  # 静态资源
├── styles/                  # 样式文件
├── .dockerignore           # Docker 忽略文件
├── .gitignore              # Git 忽略文件
├── .npmrc                  # NPM 配置
├── .prettierrc.js          # Prettier 配置
├── .windsurfrules          # 项目规则配置
├── ARCHITECTURE.md         # 架构文档
├── Dockerfile              # Docker 构建文件
├── LICENSE                 # 许可证文件
├── README.md               # 英文说明文档
├── README.zh-CN.md         # 中文说明文档
├── commitlint.config.mjs   # Commit 规范配置
├── jsconfig.json           # JavaScript 配置
├── next.config.js          # Next.js 配置
├── package.json            # 项目依赖配置
└── package-lock.json       # 依赖版本锁定文件
```

## 注意事项

1. 项目使用 pnpm 作为包管理器，请确保已全局安装 pnpm
2. 开发服务器默认运行在 1717 端口
3. 首次运行需要执行数据库迁移：`pnpm db:push`
4. 如果遇到构建脚本被忽略的警告，可以运行 `pnpm approve-builds` 来允许这些脚本运行

## 常见问题

1. 如果遇到依赖安装问题，可以尝试：
   ```powershell
   pnpm store prune
   pnpm install
   ```

2. 如果遇到数据库问题，可以尝试：
   ```powershell
   pnpm db:push
   ```

3. 如果需要清理构建文件：
   ```powershell
   pnpm clean-dist
   ```

## 其他命令

### 数据库相关
```powershell
# 启动 Prisma Studio（数据库管理界面）
pnpm db:studio

# 推送数据库更改
pnpm db:push

# 生成数据库模板
pnpm db:template
```

### 开发工具
```powershell
# 运行代码检查
pnpm lint

# 格式化代码
pnpm prettier
```

### Docker 相关
```powershell
# 构建 Docker 镜像
pnpm docker
```

这个指南涵盖了项目的基本部署和运行步骤。如果你需要更详细的信息，可以查看项目中的 `README.md` 或 `README.zh-CN.md` 文件。 