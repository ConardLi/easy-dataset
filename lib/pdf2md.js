'use server';
const fs = require('fs')
import path from 'path';
const pdf2md = require('@opendocsg/pdf2md')
import {
    getProjectRoot,
  } from './db/base';

export async function convertMd(projectId,fileName) {
    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);

    // 获取文件路径
    const filePath = path.join(projectPath, 'files', fileName);

    //获取文件
    const pdfBuffer = fs.readFileSync(filePath);

    //将pdf 转换成 markdown 文件
    await pdf2md(pdfBuffer)
        .then(text => {
            let outputFile = filePath.replace(/\.([^.]*)$/, '')+".md";
            console.log(`Writing to ${outputFile}...`);
            fs.writeFileSync(path.resolve(outputFile), text);
            console.log('Done.');
        })
        .catch(err => {
            console.error(err);
        })
        
   //仅将修改后的文件名返回即可，不需要完整路径
   return fileName.replace(/\.([^.]*)$/, '')+".md";
}