<div align="center">

![](./public/imgs/bg2.png)

<img src="https://img.shields.io/badge/version-0.1.0-blue.svg" alt="version 1.0.0"/>
<img src="https://img.shields.io/badge/license-Apache--2.0-green.svg" alt="Apache 2.0 License"/>
<img src="https://img.shields.io/badge/Next.js-14.1.0-black" alt="Next.js 14.1.0"/>
<img src="https://img.shields.io/badge/React-18.2.0-61DAFB" alt="React 18.2.0"/>
<img src="https://img.shields.io/badge/MUI-5.15.7-007FFF" alt="Material UI 5.15.7"/>

**A powerful tool for creating fine-tuning datasets for Large Language Models**

[简体中文](./README.zh-CN.md) | [English](./README.md)

[Features](#features) • [Getting Started](#getting-started) • [Usage](#usage) • [Documentation](https://rncg5jvpme.feishu.cn/docx/IRuad1eUIo8qLoxxwAGcZvqJnDb?302from=wiki) • [Contributing](#contributing) • [License](#license)

</div>

If you like this project, please leave a Star ⭐️ for it. Or you can buy the author a cup of coffee => [Support the author](./public/imgs/aw.jpg) ❤️! 

## Overview

Easy Dataset is a specialized application designed to streamline the creation of fine-tuning datasets for Large Language Models (LLMs). It offers an intuitive interface for uploading domain-specific files, intelligently splitting content, generating questions, and producing high-quality training data for model fine-tuning.

With Easy Dataset, you can transform your domain knowledge into structured datasets compatible with all OpenAI-format compatible LLM APIs, making the fine-tuning process accessible and efficient.

![](./public/imgs/en-arc.png)

## Features

- **Intelligent Document Processing**: Upload Markdown files and automatically split them into meaningful segments
- **Smart Question Generation**: Extract relevant questions from each text segment
- **Answer Generation**: Generate comprehensive answers for each question using LLM APIs
- **Flexible Editing**: Edit questions, answers, and datasets at any stage of the process
- **Multiple Export Formats**: Export datasets in various formats (Alpaca, ShareGPT) and file types (JSON, JSONL)
- **Wide Model Support**: Compatible with all LLM APIs that follow the OpenAI format
- **User-Friendly Interface**: Intuitive UI designed for both technical and non-technical users
- **Customizable System Prompts**: Add custom system prompts to guide model responses

## Getting Started

### Download Client

<table style="width: 400px">
  <tr>
    <td width="25%" align="center">
      <b>Windows</b>
    </td>
    <td width="25%" align="center" colspan="2">
      <b>MacOS</b>
    </td>
    <td width="25%" align="center">
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

### Using npm

- Node.js 18.x or higher
- pnpm (recommended) or npm

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

### Build with Local Dockerfile  

If you want to build the image yourself, you can use the Dockerfile in the project root directory:  

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
   docker run -d -p 1717:1717 -v {YOUR_LOCAL_DB_PATH}:/app/local-db --name easy-dataset easy-dataset
   ```  
   **Note:** Replace `{YOUR_LOCAL_DB_PATH}` with the actual path where you want to store the local database.  

4. Open your browser and navigate to `http://localhost:1717`

## Usage

### Creating a Project

<table>
    <tr>
        <td><img src="./public/imgs/1.png"></td>
        <td><img src="./public/imgs/2.png"></td>
    </tr>
</table>


1. Click the "Create Project" button on the home page
2. Enter a project name and description
3. Configure your preferred LLM API settings

### Processing Documents

<table>
    <tr>
        <td><img src="./public/imgs/3.png"></td>
        <td><img src="./public/imgs/4.png"></td>
    </tr>
</table>

1. Upload your Markdown files in the "Text Split" section
2. Review the automatically split text segments
3. Adjust the segmentation if needed

### Generating Questions

<table>
    <tr>
        <td><img src="./public/imgs/5.png"></td>
        <td><img src="./public/imgs/6.png"></td>
    </tr>
</table>

1. Navigate to the "Questions" section
2. Select text segments to generate questions from
3. Review and edit the generated questions
4. Organize questions using the tag tree

### Creating Datasets

<table>
    <tr>
        <td><img src="./public/imgs/7.png"></td>
        <td><img src="./public/imgs/8.png"></td>
    </tr>
</table>

1. Go to the "Datasets" section
2. Select questions to include in your dataset
3. Generate answers using your configured LLM
4. Review and edit the generated answers

### Exporting Datasets

<table>
    <tr>
        <td><img src="./public/imgs/9.png"></td>
        <td><img src="./public/imgs/10.png"></td>
    </tr>
</table>

1. Click the "Export" button in the Datasets section
2. Select your preferred format (Alpaca or ShareGPT)
3. Choose file format (JSON or JSONL)
4. Add custom system prompts if needed
5. Export your dataset

## Project Structure

```
easy-dataset/
├── app/                                # Next.js application directory
│   ├── api/                            # API routes
│   │   ├── llm/                        # LLM API integration
│   │   │   ├── ollama/                 # Ollama API integration
│   │   │   └── openai/                 # OpenAI API integration
│   │   ├── projects/                   # Project management APIs
│   │   │   ├── [projectId]/            # Project-specific operations
│   │   │   │   ├── chunks/             # Text chunk operations
│   │   │   │   ├── datasets/           # Dataset generation and management
│   │   │   │   │   └── optimize/       # Dataset optimization API
│   │   │   │   ├── generate-questions/ # Batch question generation
│   │   │   │   ├── questions/          # Question management
│   │   │   │   └── split/              # Text splitting operations
│   │   │   └── user/                   # User-specific project operations
│   ├── projects/                       # Front-end project pages
│   │   └── [projectId]/                # Project-specific pages
│   │       ├── datasets/               # Dataset management UI
│   │       ├── questions/              # Question management UI
│   │       ├── settings/               # Project settings UI
│   │       └── text-split/             # Text processing UI
│   └── page.js                         # Home page
├── components/                         # React components
│   ├── datasets/                       # Dataset-related components
│   ├── home/                           # Home page components
│   ├── projects/                       # Project management components
│   ├── questions/                      # Question management components
│   └── text-split/                     # Text processing components
├── lib/                                # Core libraries and utilities
│   ├── db/                             # Database operations
│   ├── i18n/                           # Internationalization
│   ├── llm/                            # LLM integration
│   │   ├── common/                     # Common LLM utilities
│   │   ├── core/                       # Core LLM client
│   │   └── prompts/                    # Prompt templates
│   │       ├── answer.js               # Answer generation prompts (Chinese)
│   │       ├── answerEn.js             # Answer generation prompts (English)
│   │       ├── question.js             # Question generation prompts (Chinese)
│   │       ├── questionEn.js           # Question generation prompts (English)
│   │       └── ... other prompts
│   └── text-splitter/                  # Text splitting utilities
├── locales/                            # Internationalization resources
│   ├── en/                             # English translations
│   └── zh-CN/                          # Chinese translations
├── public/                             # Static assets
│   └── imgs/                           # Image resources
└── local-db/                           # Local file-based database
    └── projects/                       # Project data storage
```


## Documentation

For detailed documentation on all features and APIs, please visit our [Documentation Site](https://rncg5jvpme.feishu.cn/docx/IRuad1eUIo8qLoxxwAGcZvqJnDb?302from=wiki).

## Contributing

We welcome contributions from the community! If you'd like to contribute to Easy Dataset, please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please make sure to update tests as appropriate and adhere to the existing coding style.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ConardLi/easy-dataset&type=Date)](https://www.star-history.com/#ConardLi/easy-dataset&Date)


<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/ConardLi">ConardLi</a> • Follow  me：<a href="https://mp.weixin.qq.com/s/ac9XWvVsaXpSH1HH2x4TRQ">WeChat</a>｜<a href="https://space.bilibili.com/474921808">Bilibili</a>｜<a href="https://juejin.cn/user/3949101466785709">Juijin</a>｜<a href="https://www.zhihu.com/people/wen-ti-chao-ji-duo-de-xiao-qi">Zhihu</a></sub>
</div>
