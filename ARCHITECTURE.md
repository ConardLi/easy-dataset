# Easy DataSet 项目架构设计

## 项目概述

Easy DataSet 是一个用于创建大模型微调数据集的应用程序。用户可以上传文本文件，系统会自动分割文本并生成问题，最终生成用于微调的数据集。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI 框架**: Material-UI (MUI)
- **数据存储**: fs 文件系统模拟数据库
- **开发语言**: JavaScript

## 目录结构

```
dataset/
├── app/                      # Next.js 应用目录
│   ├── api/                 # API 路由
│   │   └── projects/       # 项目相关 API
│   ├── projects/           # 项目相关页面
│   │   ├── [projectId]/    # 项目详情页面
│   └── page.js            # 主页
├── components/             # React 组件
│   ├── home/              # 主页相关组件
│   │   ├── HeroSection.js
│   │   ├── ProjectList.js
│   │   └── StatsCard.js
│   ├── Navbar.js          # 导航栏组件
│   └── CreateProjectDialog.js
├── lib/                    # 工具库
│   └── db/                # 数据库模块
│       ├── base.js        # 基础工具函数
│       ├── projects.js    # 项目管理
│       ├── texts.js       # 文本处理
│       ├── datasets.js    # 数据集管理
│       └── index.js       # 模块导出
├── styles/                # 样式文件
│   └── home.js           # 主页样式
└── local-db/             # 本地数据库目录
```

## 核心模块设计

### 1. 数据库模块 (`lib/db/`)

#### base.js

- 提供基础的文件操作功能
- 确保数据库目录存在
- 读写 JSON 文件的工具函数

#### projects.js

- 项目的 CRUD 操作
- 项目配置管理
- 项目目录结构维护

#### texts.js

- 文献处理功能
- 文本片段存储和检索
- 文件上传处理

#### datasets.js

- 数据集生成和管理
- 问题列表管理
- 标签树管理

### 2. 前端组件 (`components/`)

#### Navbar.js

- 顶部导航栏
- 项目切换
- 模型选择
- 主题切换

#### home/ 目录组件

- HeroSection.js: 主页顶部展示区
- ProjectList.js: 项目列表展示
- StatsCard.js: 数据统计展示
- CreateProjectDialog.js: 创建项目的对话框

### 3. 页面路由 (`app/`)

#### 主页 (`page.js`)

- 项目列表展示
- 创建项目入口
- 数据统计展示

#### 项目详情页 (`projects/[projectId]/`)

- text-split/: 文献处理页面
- questions/: 问题列表页面
- datasets/: 数据集页面
- settings/: 项目设置页面

#### API 路由 (`api/`)

- projects/: 项目管理 API
- texts/: 文本处理 API
- questions/: 问题生成 API
- datasets/: 数据集管理 API

## 数据流设计

### 项目创建流程

1. 用户通过主页或导航栏创建新项目
2. 填写项目基本信息（名称、描述）
3. 系统创建项目目录和初始配置文件
4. 重定向到项目详情页

### 文献处理流程

1. 用户上传 Markdown 文件
2. 系统保存原始文件到项目目录
3. 调用文本分割服务，生成片段和目录结构
4. 展示分割结果和提取的目录

### 问题生成流程

1. 用户选择需要生成问题的文本片段
2. 系统调用大模型API生成问题
3. 保存问题到问题列表和标签树

### 数据集生成流程

1. 用户选择需要生成答案的问题
2. 系统调用大模型API生成答案
3. 保存数据集结果
4. 提供导出功能

## 模型配置

支持多种大模型提供商配置：

- Ollama
- OpenAI
- 硅基流动
- 深度求索
- 智谱AI

每个提供商支持配置：

- API 地址
- API 密钥
- 模型名称

## 未来扩展方向

1. 支持更多文件格式（PDF、DOC等）
2. 增加数据集质量评估功能
3. 添加数据集版本管理
4. 实现团队协作功能
5. 增加更多数据集导出格式

## 国际化处理

### 技术选型

- **国际化库**: i18next + react-i18next
- **语言检测**: i18next-browser-languagedetector
- **支持语言**: 英文(en)、简体中文(zh-CN)

### 目录结构

```
dataset/
├── locales/              # 国际化资源目录
│   ├── en/              # 英文翻译
│   │   └── translation.json
│   └── zh-CN/           # 中文翻译
│       └── translation.json
├── lib/
│   └── i18n.js          # i18next 配置
```
