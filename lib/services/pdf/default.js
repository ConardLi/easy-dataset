
import pdf2md from '@opendocsg/pdf2md';
import { getProjectRoot } from '@/lib/db/base';
import fs from 'fs';
import path from 'path';

export async function defaultProcessing(projectId, fileName) {
    console.log('executing default pdf conversion strategy......');
    
    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);

    // 获取文件路径
    const filePath = path.join(projectPath, 'files', fileName);

    // 读取文件
    const pdfBuffer = fs.readFileSync(filePath);

    // 转换后文件名
    const convertName = fileName.replace(/\.([^.]*)$/, '') + '.md';

    try {
      const text = await pdf2md(pdfBuffer);
      const outputFile = path.join(projectPath, 'files', convertName);
      console.log(`Writing to ${outputFile}...`);
      fs.writeFileSync(path.resolve(outputFile), text);
      console.log('pdf conversion completed!');
      
      // 返回转换后的文件名
      return { success: true , fileName: convertName };
    } catch (err) {
      console.error('pdf conversion failed:', err);
      throw err;
    }
}

export default {
  defaultProcessing
};
