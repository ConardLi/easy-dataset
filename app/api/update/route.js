import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

// 执行更新脚本
export async function POST() {
  try {
    // 检查是否在客户端环境中运行
    const desktopDir = path.join(process.cwd(), 'desktop');
    const updaterPath = path.join(desktopDir, 'scripts', 'updater.js');
    
    if (!fs.existsSync(updaterPath)) {
      return NextResponse.json({ 
        success: false, 
        message: '更新功能仅在客户端环境中可用' 
      }, { status: 400 });
    }
    
    // 执行更新脚本
    return new Promise((resolve) => {
      const updaterProcess = exec(`node "${updaterPath}"`, { cwd: process.cwd() });
      
      let output = '';
      
      updaterProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`更新输出: ${data}`);
      });
      
      updaterProcess.stderr.on('data', (data) => {
        output += data.toString();
        console.error(`更新错误: ${data}`);
      });
      
      updaterProcess.on('close', (code) => {
        console.log(`更新进程退出，退出码: ${code}`);
        
        if (code === 0) {
          resolve(NextResponse.json({ 
            success: true, 
            message: '更新成功，应用将重启' 
          }));
        } else {
          resolve(NextResponse.json({ 
            success: false, 
            message: `更新失败，退出码: ${code}，输出: ${output}` 
          }, { status: 500 }));
        }
      });
    });
  } catch (error) {
    console.error('执行更新失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: `执行更新失败: ${error.message}` 
    }, { status: 500 });
  }
}
