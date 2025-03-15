'use server';

import fs from 'fs';
import path from 'path';
import pdf2md from '@opendocsg/pdf2md';
import { getProjectRoot } from './db/base';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

//PDF文件夹处理
export async function pdfHandle(projectId,fileName) {
    
    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);

    // 获取文件路径
    const filePath = path.join(projectPath, 'files', fileName);

    //获取文件
    const pdfBuffer = fs.readFileSync(filePath);

    //转后文件名
    const convertName = fileName.replace(/\.([^.]*)$/, '')+".md";

    await pdf2md(pdfBuffer)
        .then(text => {
            let outputFile = path.join(projectPath, 'files', convertName);
            console.log(`Writing to ${outputFile}...`);
            fs.writeFileSync(path.resolve(outputFile), text);
            console.log('Done.');
        })
        .catch(err => {
            console.error(err);
        })
   //仅将修改后的文件名返回即可，不需要完整路径
   return convertName;
}

 //Word 文件处理
export async function wordHandle(projectId,fileName) {
    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);

    // 获取文件路径
    const filePath = path.join(projectPath, 'files', fileName);

    //转后文件名
    const convertName = fileName.replace(/\.([^.]*)$/, '')+".md";

    //先将work转换成html
    let html = null;

    await mammoth.convertToHtml({path: filePath})
    .then(function(result){
        console.log(`convert to html...`);
        html = result.value;
        console.log('Done.');
    })
    .catch(function(error) {
        console.error(error);
    });

    //将html转换成Markdown文件
    let turndownService = new TurndownService({ headingStyle: 'atx' });

    const text =  turndownService.turndown(html);
    //图片会被转成base64的数据，会导致整个文件字符数非常多，这里先排除。
    let cleanedText = text.replace(/!\[\]\(data:image\/[^)]+\)/g, '');
    let outputFile = path.join(projectPath, 'files', convertName);

    console.log(`Writing to ${outputFile}...`);
    fs.writeFileSync(path.resolve(outputFile), cleanedText);
    console.log('Done.');

    return convertName;
}