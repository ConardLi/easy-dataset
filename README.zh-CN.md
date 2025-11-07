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

GKGAI Dataset Generation 是一个专为创建大型语言模型（LLM）微调数据集而设计的应用程序。它提供了直观的界面，用于上传特定领域的文件，智能分割内容，生成问题，并为模型微调生成高质量的训练数据。

通过 GKGAI Dataset Generation，您可以将领域知识转化为结构化数据集，兼容所有遵循 OpenAI 格式的 LLM API，使微调过程变得简单高效。

![](./public/imgs/cn-arc.png)

## 功能特点

- **智能文档处理**：支持 PDF、Markdown、DOCX 等多种格式智能识别和处理
- **智能文本分割**：支持多种智能文本分割算法、支持自定义可视化分段
- **智能问题生成**：从每个文本片段中提取相关问题
- **领域标签**：为数据集智能构建全局领域标签，具备全局理解能力
- **答案生成**：使用 LLM API 为每个问题生成全面的答案、思维链（COT）
- **灵活编辑**：在流程的任何阶段编辑问题、答案和数据集
- **多种导出格式**：以各种格式（Alpaca、ShareGPT）和文件类型（JSON、JSONL）导出数据集
- **广泛的模型支持**：兼容所有遵循 OpenAI 格式的 LLM API
- **用户友好界面**：为技术和非技术用户设计的直观 UI
- **自定义系统提示**：添加自定义系统提示以引导模型响应

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
      - ./local-db:/app/local-db
      # - ./prisma:/app/prisma 如果需要挂载请先手动初始化数据库文件
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

## 使用方法

### 创建项目

<table>
    <tr>
        <td><img src="./public/imgs/1.png"></td>
        <td><img src="./public/imgs/2.png"></td>
    </tr>
</table>

1. 在首页点击"创建项目"按钮；
2. 输入项目名称和描述；
3. 配置您首选的 LLM API 设置

### 处理文档

<table>
    <tr>
        <td><img src="./public/imgs/3.png"></td>
        <td><img src="./public/imgs/4.png"></td>
    </tr>
</table>

1. 在"文本分割"部分上传您的文件（支持 PDF、Markdwon、txt、DOCX）；
2. 查看和调整自动分割的文本片段；
3. 查看和调整全局领域树

### 生成问题

<table>
    <tr>
        <td><img src="./public/imgs/5.png"></td>
        <td><img src="./public/imgs/6.png"></td>
    </tr>
</table>

2. 基于文本块批量构造问题；
3. 查看并编辑生成的问题；
4. 使用标签树组织问题

### 创建数据集

<table>
    <tr>
        <td><img src="./public/imgs/7.png"></td>
        <td><img src="./public/imgs/8.png"></td>
    </tr>
</table>

1. 基于问题批量构造数据集；
2. 使用配置的 LLM 生成答案；
3. 查看、编辑并优化生成的答案

### 导出数据集

<table>
    <tr>
        <td><img src="./public/imgs/9.png"></td>
        <td><img src="./public/imgs/10.png"></td>
    </tr>
</table>

1. 在数据集部分点击"导出"按钮；
2. 选择您喜欢的格式（Alpaca 或 ShareGPT 或 multilingual-thinking）；
3. 选择文件格式（JSON 或 JSONL）；
4. 根据需要添加自定义系统提示；
5. 导出您的数据集

## 文档

- 有关所有功能和 API 的详细文档，请访问我们的 [文档站点](https://docs.easy-dataset.com/)
- 查看本项目的演示视频：[GKGAI Dataset Generation 演示视频](https://www.bilibili.com/video/BV1y8QpYGE57/)
- 查看本项目的论文：[Easy Dataset: A Unified and Extensible Framework for Synthesizing LLM Fine-Tuning Data from Unstructured Documents](https://arxiv.org/abs/2507.04009v1)

## 社区教程

- [GKGAI Dataset Generation × LLaMA Factory: 让大模型高效学习领域知识](https://buaa-act.feishu.cn/wiki/KY9xwTGs1iqHrRkjXBwcZP9WnL9)
- [GKGAI Dataset Generation 使用实战: 如何构建高质量数据集？](https://www.bilibili.com/video/BV1MRMnz1EGW)
- [GKGAI Dataset Generation 重点功能更新解读](https://www.bilibili.com/video/BV1fyJhzHEb7/)
- [大模型微调数据集: 基础知识科普](https://docs.easy-dataset.com/zhi-shi-ke-pu)

## 贡献

我们欢迎社区的贡献！如果您想为 GKGAI Dataset Generation 做出贡献，请按照以下步骤操作：

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
