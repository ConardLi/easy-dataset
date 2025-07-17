<div align="center">

![](./public//imgs/bg2.png)

<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/ConardLi/easy-dataset">
<img alt="GitHub Downloads (all assets, all releases)" src="https://img.shields.io/github/downloads/ConardLi/easy-dataset/total">
<img alt="GitHub Release" src="https://img.shields.io/github/v/release/ConardLi/easy-dataset">
<img src="https://img.shields.io/badge/license-AGPL--3.0-green.svg" alt="AGPL 3.0 License"/>
<img alt="GitHub contributors" src="https://img.shields.io/github/contributors/ConardLi/easy-dataset">
<img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/ConardLi/easy-dataset">
<a href="https://arxiv.org/abs/2507.04009v1" target="_blank">
  <img src="https://img.shields.io/badge/arXiv-2507.04009-b31b1b.svg" alt="arXiv:2507.04009">
</a>

<a href="https://trendshift.io/repositories/13944" target="_blank"><img src="https://trendshift.io/api/badge/repositories/13944" alt="ConardLi%2Feasy-dataset | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

**一个强大的大型语言模型微调数据集创建工具**

[简体中文](./README.zh-CN.md) | [English](./README.md)

[功能特点](#功能特点) • [快速开始](#本地运行) • [使用文档](https://docs.easy-dataset.com/) • [贡献](#贡献) • [许可证](#许可证)

如果喜欢本项目，请给本项目留下 Star⭐️，或者请作者喝杯咖啡呀 => [打赏作者](./public/imgs/aw.jpg) ❤️！

</div>

## 概述

Easy Dataset 是一个专为创建大型语言模型（LLM）微调数据集而设计的应用程序。它提供了直观的界面，用于上传特定领域的文件，智能分割内容，生成问题，并为模型微调生成高质量的训练数据。

通过 Easy Dataset，您可以将领域知识转化为结构化数据集，兼容所有遵循 OpenAI 格式的 LLM API，使微调过程变得简单高效。

![](./public/imgs/cn-arc.png)

## 功能特点

- **全局模型配置**：一次配置，全局通用。在全局设置中配置您的 LLM 供应商和模型，即可在所有项目中无缝使用。
- **先进的文档处理**：支持 PDF、Markdown、DOCX、TXT 等多种格式，并提供多种智能文本分割策略。
- **多层次问题生成**：超越简单的问答。您可以生成不同粒度的问题：
  - **局部型**：从单个文本块中提取细粒度的事实。
  - **上下文型**：通过关联相邻文本块的信息，创建更复杂、需要推理的问题。
  - **全局型**：基于文档的整体结构（目录）提出高层次的、分析性的问题。
- **“智能混合”策略**：一键生成综合性的高质量数据集。只需设定问题总数和您期望的局部、上下文、全局问题的比例即可。
- **上下文感知答案生成**：在生成答案时，系统会自动为不同类型的问题匹配正确的上下文范围（单个文本块、相邻文本块或整个文档），确保答案的逻辑一致性和高质量。
- **灵活的数据管理**：轻松查看、编辑和管理生成的问题与数据集。
- **多种导出格式**：以多种格式（Alpaca、ShareGPT）和文件类型（JSON、JSONL）导出您的高质量数据集，无缝对接到 LLaMA Factory 等主流训练框架。
- **用户友好界面**：为技术和非技术用户设计的直观 UI。

## 快速演示

https://github.com/user-attachments/assets/6ddb1225-3d1b-4695-90cd-aa4cb01376a8

## 本地运行

### 下载客户端

<table style="width: 100%">
  <tr>
    <td width="20%" align="center">
      <b>Windows</b>
    </td>
    <td width="30%" align="center" colspan="2">
      <b>MacOS</b>
    </td>
    <td width="20%" align="center">
      <b>Linux</b>
    </td>
  </tr>
  <tr style="text-align: center">
    <td align="center" valign="middle">
      <a href='https://github.com/ConardLi/easy-dataset/releases/latest'>
        <img src='./public/imgs/windows.png' style="height:24px; width: 24px" />
        <br />
        <b>Setup.exe</b>
      </a>
    </td>
    <td align="center" valign="middle">
      <a href='https://github.com/ConardLi/easy-dataset/releases/latest'>
        <img src='./public/imgs/mac.png' style="height:24px; width: 24px" />
        <br />
        <b>Intel</b>
      </a>
    </td>
    <td align="center" valign="middle">
      <a href='https://github.com/ConardLi/easy-dataset/releases/latest'>
        <img src='./public/imgs/mac.png' style="height:24px; width: 24px" />
        <br />
        <b>M</b>
      </a>
    </td>
    <td align="center" valign="middle">
      <a href='https://github.com/ConardLi/easy-dataset/releases/latest'>
        <img src='./public/imgs/linux.png' style="height:24px; width: 24px" />
        <br />
        <b>AppImage</b>
      </a>
    </td>
  </tr>
</table>

### 使用 NPM 安装

1. 克隆仓库：

```bash
   git clone https://github.com/ConardLi/easy-dataset.git
   cd easy-dataset
```

2. 安装依赖：

```bash
   npm install
```

3. 启动开发服务器：

```bash
   npm run build

   npm run start
```

4. 打开浏览器并访问 `http://localhost:1717`

### 使用官方 Docker 镜像

1. 克隆仓库：

```bash
git clone https://github.com/ConardLi/easy-dataset.git
cd easy-dataset
```

2. 更改 `docker-compose.yml` 文件：

```yml
services:
  easy-dataset:
    image: ghcr.io/conardli/easy-dataset
    container_name: easy-dataset
    ports:
      - '1717:1717'
    volumes:
      - ${LOCAL_DB_PATH}:/app/local-db
      - ${LOCAL_PRISMA_PATH}:/app/prisma
    restart: unless-stopped
```

> **注意：** 请将 `{YOUR_LOCAL_DB_PATH}`、`{LOCAL_PRISMA_PATH}` 替换为你希望存储本地数据库的实际路径，建议直接使用当前代码仓库目录下的 `local-db` 和 `prisma` 文件夹，这样可以和 NPM 启动时的数据库路径保持一致。

> **注意：** 如果需要挂载数据库文件（PRISMA），需要提前执行 `npm run db:push` 初始化数据库文件。

3. 使用 docker-compose 启动

```bash
docker-compose up -d
```

4. 打开浏览器并访问 `http://localhost:1717`

### 使用本地 Dockerfile 构建

如果你想自行构建镜像，可以使用项目根目录中的 Dockerfile：

1. 克隆仓库：

```bash
git clone https://github.com/ConardLi/easy-dataset.git
cd easy-dataset
```

2. 构建 Docker 镜像：

```bash
docker build -t easy-dataset .
```

3. 运行容器：

```bash
docker run -d \
  -p 1717:1717 \
  -v {YOUR_LOCAL_DB_PATH}:/app/local-db \
  -v {LOCAL_PRISMA_PATH}:/app/prisma \
  --name easy-dataset \
  easy-dataset
```

> **注意：** 请将 `{YOUR_LOCAL_DB_PATH}`、`{LOCAL_PRISMA_PATH}` 替换为你希望存储本地数据库的实际路径，建议直接使用当前代码仓库目录下的 `local-db` 和 `prisma` 文件夹，这样可以和 NPM 启动时的数据库路径保持一致。

> **注意：** 如果需要挂载数据库文件（PRISMA），需要提前执行 `npm run db:push` 初始化数据库文件。

4. 打开浏览器，访问 `http://localhost:1717`

## 推荐工作流

我们推荐您采用以下工作流，以最高效地利用 Easy Dataset 创建高质量、多层次的数据集：

### 第一步：全局模型配置

1.  **进入全局设置**：点击导航栏右上角的设置图标 (⚙️)，进入全局模型管理页面。
2.  **添加您的 LLM**：添加并配置您希望使用的大语言模型。此操作只需进行一次，配置好的模型将在您所有的项目中可用。

### 第二步：创建项目并上传文档

1.  **创建新项目**：返回首页并创建一个新项目。
2.  **上传您的知识库**：进入“文献处理”模块，上传您的领域知识文档（例如 PDF、Markdown 文件）。系统会自动将其处理并分割成易于管理的文本块。

### 第三步：一键生成多层次问题

1.  **进入问题管理**：导航到“问题管理”页面。
2.  **启动问题生成**：点击“生成问题”按钮。
3.  **使用“智能混合”策略**：在弹出的对话框中，保持默认的“智能混合生成”策略。
4.  **设定总数与配比**：输入您期望生成的问题总数（例如 1000），并选择一个符合您目标的预设配比（例如“深度分析模型”）。您也可以自定义各个粒度问题的比例。
5.  **开始任务**：点击“开始”。系统现在会在后台自动生成混合了全局、上下文和局部三个层次的丰富问题。

### 第四步：生成上下文感知的答案

1.  **选择问题**：问题生成任务完成后，停留在“问题管理”页面，选中所有新生成的问题。
2.  **批量生成答案**：点击“批量构造数据集”按钮（或类似名称的批量生成答案按钮）。
3.  **智能生成**：系统会自动检测每个问题的类型（全局、上下文或局部），并在生成答案时为 LLM 提供正确范围的上下文，从而确保答案的高质量和逻辑一致性。

### 第五步：审查与导出

1.  **管理您的数据集**：导航到“数据集管理”页面，在这里您可以审查、筛选和编辑已生成的问答对。
2.  **导出用于微调**：使用“导出”功能，将您的高质量数据集以 Alpaca 或 ShareGPT 等格式导出，以便在 LLaMA Factory 等框架中进行模型微调。

<!--- 开发者提示：旧的工作流截图已被移除。请更新此处的截图以反映新的用户界面和工作流程，特别是全局模型设置页面和新的“生成问题”对话框。 --->

## 文档

- 有关所有功能和 API 的详细文档，请访问我们的 [文档站点](https://docs.easy-dataset.com/)
- 查看本项目的演示视频：[Easy Dataset 演示视频](https://www.bilibili.com/video/BV1y8QpYGE57/)
- 查看本项目的论文：[Easy Dataset: A Unified and Extensible Framework for Synthesizing LLM Fine-Tuning Data from Unstructured Documents](https://arxiv.org/abs/2507.04009v1)

## 社区教程

- [Easy Dataset × LLaMA Factory: 让大模型高效学习领域知识](https://buaa-act.feishu.cn/wiki/KY9xwTGs1iqHrRkjXBwcZP9WnL9)
- [Easy Dataset 使用实战: 如何构建高质量数据集？](https://www.bilibili.com/video/BV1MRMnz1EGW)
- [Easy Dataset 重点功能更新解读](https://www.bilibili.com/video/BV1fyJhzHEb7/)
- [大模型微调数据集: 基础知识科普](https://docs.easy-dataset.com/zhi-shi-ke-pu)

## 贡献

我们欢迎社区的贡献！如果您想为 Easy Dataset 做出贡献，请按照以下步骤操作：

1. Fork 仓库
2. 创建新分支（`git checkout -b feature/amazing-feature`）
3. 进行更改
4. 提交更改（`git commit -m '添加一些惊人的功能'`）
5. 推送到分支（`git push origin feature/amazing-feature`）
6. 打开 Pull Request（提交至 DEV 分支）

请确保适当更新测试并遵守现有的编码风格。

## 加交流群 & 联系作者

https://docs.easy-dataset.com/geng-duo/lian-xi-wo-men

## 许可证

本项目采用 AGPL 3.0 许可证 - 有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

## 引用

如果您觉得此项目有帮助，请考虑以下列格式引用

```bibtex
@misc{miao2025easydataset,
  title={Easy Dataset: A Unified and Extensible Framework for Synthesizing LLM Fine-Tuning Data from Unstructured Documents},
  author={Ziyang Miao and Qiyu Sun and Jingyuan Wang and Yuchen Gong and Yaowei Zheng and Shiqi Li and Richong Zhang},
  year={2025},
  eprint={2507.04009},
  archivePrefix={arXiv},
  primaryClass={cs.CL},
  url={https://arxiv.org/abs/2507.04009}
}
```

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ConardLi/easy-dataset&type=Date)](https://www.star-history.com/#ConardLi/easy-dataset&Date)

<div align="center">
  <sub>由 <a href="https://github.com/ConardLi">ConardLi</a> 用 ❤️ 构建 • 关注我：<a href="./public/imgs/weichat.jpg">公众号</a>｜<a href="https://space.bilibili.com/474921808">B站</a>｜<a href="https://juejin.cn/user/3949101466785709">掘金</a>｜<a href="https://www.zhihu.com/people/wen-ti-chao-ji-duo-de-xiao-qi">知乎</a>｜<a href="https://www.youtube.com/@garden-conard">Youtube</a></sub>
</div>
