const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');
/**
 * 清除本地数据库缓存（MySQL 版本仅需移除遗留目录）
 * @param {Object} app Electron app 对象
 * @returns {Promise<boolean>} 操作是否成功
 */
async function clearDatabaseCache(app) {
  const localDbDir = path.join(app.getPath('userData'), 'local-db');
  if (fs.existsSync(localDbDir)) {
    await fs.promises.rm(localDbDir, { recursive: true, force: true });
    global.appLog(`已清理本地数据库缓存目录: ${localDbDir}`);
  }
  return true;
}

/**
 * 初始化数据库配置
 * 现在使用 MySQL，不再创建本地 sqlite 文件
 * @param {Object} app Electron app 对象
 * @returns {Promise<Object>} 数据库配置信息
 */
async function initializeDatabase(app) {
  try {
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'local-db');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      global.appLog(`数据目录已创建: ${dataDir}`);
    }

    // 仍然写入 root-path 以兼容原有逻辑
    try {
      fs.writeFileSync(path.join(process.resourcesPath, 'root-path.txt'), dataDir);
    } catch (error) {
      global.appLog(`写入 root-path.txt 失败: ${error.message}`);
    }

    const dbConnectionString = process.env.DATABASE_URL || '';
    global.appLog(`当前使用的数据库连接: ${dbConnectionString || '未设置 DATABASE_URL'}`);

    return {
      userDataPath,
      dataDir,
      dbConnectionString
    };
  } catch (error) {
    console.error('初始化数据库配置时发生错误:', error);
    throw error;
  }
}

module.exports = {
  clearDatabaseCache,
  initializeDatabase
};
