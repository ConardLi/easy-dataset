import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// 获取当前版本
function getCurrentVersion() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('读取版本信息失败:', String(error));
    return '1.0.0';
  }
}

// 从 GitHub 获取最新版本
async function getLatestVersion() {
  try {
    const owner = 'ConardLi';
    const repo = 'dataset';
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);

    if (!response.ok) {
      throw new Error(`GitHub API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.tag_name.replace('v', '');
  } catch (error) {
    console.error('获取最新版本失败:', String(error));
    return null;
  }
}

// 检查是否有更新
export async function GET() {
  try {
    const currentVersion = getCurrentVersion();
    const latestVersion = await getLatestVersion();

    if (!latestVersion) {
      return NextResponse.json({
        hasUpdate: false,
        currentVersion,
        latestVersion: null,
        error: '获取最新版本失败'
      });
    }

    // 简单的版本比较
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

    return NextResponse.json({
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseUrl: hasUpdate ? `https://github.com/ConardLi/dataset/releases/tag/v${latestVersion}` : null
    });
  } catch (error) {
    console.error('检查更新失败:', String(error));
  }
}

// 简单的版本比较函数
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = i < partsA.length ? partsA[i] : 0;
    const numB = i < partsB.length ? partsB[i] : 0;

    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  return 0;
}
