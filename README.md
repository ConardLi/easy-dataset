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

**A powerful tool for creating fine-tuning datasets for Large Language Models**

[简体中文](./README.zh-CN.md) | [English](./README.md)

[Features](#features) • [Quick Start](#local-run) • [Documentation](https://docs.easy-dataset.com/ed/en) • [Contributing](#contributing) • [License](#license)

If you like this project, please give it a Star⭐️, or buy the author a coffee => [Donate](./public/imgs/aw.jpg) ❤️!

</div>

## Overview

Easy Dataset is an application specifically designed for creating fine-tuning datasets for Large Language Models (LLMs). It provides an intuitive interface for uploading domain-specific files, intelligently splitting content, generating questions, and producing high-quality training data for model fine-tuning.

With Easy Dataset, you can transform domain knowledge into structured datasets, compatible with all LLM APIs that follow the OpenAI format, making the fine-tuning process simple and efficient.

![](./public/imgs/en-arc.png)

## Features

- **Global Model Configuration**: Configure LLM providers and models once in a global setting, and use them across all projects.
- **Advanced Document Processing**: Supports various formats like PDF, Markdown, DOCX, TXT, and provides multiple intelligent text splitting strategies.
- **Multi-Level Question Generation**: Goes beyond simple Q&A. Generate questions with different granularities:
  - **Local**: Extracts fine-grained facts from single text chunks.
  - **Contextual**: Creates complex questions by associating information from adjacent text chunks.
  - **Global**: Poses high-level, analytical questions based on the document's overall structure (TOC).
- **"Smart Mix" Strategy**: One-click generation of a comprehensive dataset. Simply set the total size and desired proportion of local, contextual, and global questions.
- **Context-Aware Answer Generation**: Automatically provides the correct scope of context (a single chunk, neighboring chunks, or the full document) to the LLM when generating answers, ensuring logical consistency and quality.
- **Flexible Data Management**: Easily view, edit, and manage questions and datasets.
- **Multiple Export Formats**: Export your high-quality datasets in various formats (Alpaca, ShareGPT) and file types (JSON, JSONL) to seamlessly integrate with popular training frameworks like LLaMA Factory.
- **User-Friendly Interface**: An intuitive UI designed for both technical and non-technical users.

## Quick Demo

https://github.com/user-attachments/assets/6ddb1225-3d1b-4695-90cd-aa4cb01376a8

## Local Run

### Download Client

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

### Install with NPM

1. Clone the repository:

```bash
   git clone https://github.com/ConardLi/easy-dataset.git
   cd easy-dataset
```

2. Install dependencies:

```bash
   npm install
```

3. Start the development server:

```bash
   npm run build

   npm run start
```

4. Open your browser and visit `http://localhost:1717`

### Using the Official Docker Image

1. Clone the repository:

```bash
git clone https://github.com/ConardLi/easy-dataset.git
cd easy-dataset
```

2. Modify the `docker-compose.yml` file:

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

> **Note:** Replace `{YOUR_LOCAL_DB_PATH}` and `{LOCAL_PRISMA_PATH}` with the actual paths where you want to store the local database. It is recommended to use the `local-db` and `prisma` folders in the current code repository directory to maintain consistency with the database paths when starting via NPM.

3. Start with docker-compose:

```bash
docker-compose up -d
```

4. Open a browser and visit `http://localhost:1717`

### Building with a Local Dockerfile

If you want to build the image yourself, use the Dockerfile in the project root directory:

1. Clone the repository:

```bash
git clone https://github.com/ConardLi/easy-dataset.git
cd easy-dataset
```

2. Build the Docker image:

```bash
docker build -t easy-dataset .
```

3. Run the container:

```bash
docker run -d \
  -p 1717:1717 \
  -v {YOUR_LOCAL_DB_PATH}:/app/local-db \
  -v {LOCAL_PRISMA_PATH}:/app/prisma \
  --name easy-dataset \
  easy-dataset
```

> **Note:** Replace `{YOUR_LOCAL_DB_PATH}` and `{LOCAL_PRISMA_PATH}` with the actual paths where you want to store the local database. It is recommended to use the `local-db` and `prisma` folders in the current code repository directory to maintain consistency with the database paths when starting via NPM.

4. Open a browser and visit `http://localhost:1717`

## Recommended Workflow

Here’s the recommended workflow to efficiently create a high-quality, multi-level dataset with Easy Dataset:

### Step 1: Global Model Configuration

1.  **Navigate to Global Settings**: Click the settings icon (⚙️) in the top-right corner of the navigation bar to go to the global model settings page.
2.  **Add Your LLM**: Add and configure your preferred Large Language Model(s). You only need to do this once, and these models will be available for all your projects.

### Step 2: Create a Project and Upload Documents

1.  **Create a New Project**: Go back to the homepage and create a new project.
2.  **Upload Your Knowledge Base**: Navigate to the "Texts" section and upload your domain-specific documents (e.g., PDFs, Markdown files). The system will automatically process and split them into manageable text chunks.

### Step 3: Generate Multi-Level Questions with One Click

1.  **Go to Question Management**: Navigate to the "Questions" page.
2.  **Initiate Generation**: Click the "Generate Questions" button.
3.  **Use "Smart Mix" Strategy**: In the dialog, keep the default "Smart Mix" strategy.
4.  **Set Total Size & Profile**: Enter the total number of questions you want (e.g., 1000) and select a preset profile that matches your goal (e.g., "Deep Analysis Model"). You can also customize the proportions.
5.  **Start the Task**: Click "Start". The system will now automatically generate a mix of global, contextual, and local questions in the background.

### Step 4: Generate Context-Aware Answers

1.  **Go to Question Management**: Once the question generation task is complete, stay on the "Questions" page.
2.  **Select Questions**: Select all the newly generated questions.
3.  **Batch Generate Datasets**: Click the "Batch Generate Datasets" button.
4.  **Context-Aware Generation**: The system will automatically detect the type of each question (global, contextual, or local) and provide the correct scope of context to the LLM to generate a high-quality, logically consistent answer.

### Step 5: Review and Export

1.  **Manage Your Dataset**: Navigate to the "Datasets" page to review, filter, and edit the generated question-answer pairs.
2.  **Export for Fine-Tuning**: Use the "Export" feature to get your dataset in formats like Alpaca or ShareGPT, ready for fine-tuning with frameworks like LLaMA Factory.

<!--- DEVELOPER_NOTE: The old screenshots for the workflow have been removed. Please add new screenshots that reflect the new UI and workflow, especially for the global model settings and the new 'Generate Questions' dialog. --->

## Documentation

- View the demo video of this project: [Easy Dataset Demo Video](https://www.bilibili.com/video/BV1y8QpYGE57/)
- For detailed documentation on all features and APIs, visit our [Documentation Site](https://docs.easy-dataset.com/ed/en)
- View the paper of this project: [Easy Dataset: A Unified and Extensible Framework for Synthesizing LLM Fine-Tuning Data from Unstructured Documents](https://arxiv.org/abs/2507.04009v1)

## Community Practice

- [Easy Dataset × LLaMA Factory: Enabling LLMs to Efficiently Learn Domain Knowledge](https://buaa-act.feishu.cn/wiki/GVzlwYcRFiR8OLkHbL6cQpYin7g)
- [Easy Dataset Practical Guide: How to Build High-Quality Datasets?](https://www.bilibili.com/video/BV1MRMnz1EGW)
- [Interpretation of Key Feature Updates in Easy Dataset](https://www.bilibili.com/video/BV1fyJhzHEb7/)
- [Foundation Models Fine-tuning Datasets: Basic Knowledge Popularization](https://docs.easy-dataset.com/zhi-shi-ke-pu)

## Contributing

We welcome contributions from the community! If you'd like to contribute to Easy Dataset, please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request (submit to the DEV branch)

Please ensure that tests are appropriately updated and adhere to the existing coding style.

## Join Discussion Group & Contact the Author

https://docs.easy-dataset.com/geng-duo/lian-xi-wo-men

## License

This project is licensed under the AGPL 3.0 License - see the [LICENSE](LICENSE) file for details.

## Citation

If this work is helpful, please kindly cite as:

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
  <sub>Built with ❤️ by <a href="https://github.com/ConardLi">ConardLi</a> • Follow me: <a href="./public/imgs/weichat.jpg">WeChat Official Account</a>｜<a href="https://space.bilibili.com/474921808">Bilibili</a>｜<a href="https://juejin.cn/user/3949101466785709">Juejin</a>｜<a href="https://www.zhihu.com/people/wen-ti-chao-ji-duo-de-xiao-qi">Zhihu</a>｜<a href="https://www.youtube.com/@garden-conard">Youtube</a></sub>
</div>
