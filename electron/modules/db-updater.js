/**
 * MySQL 版本不再需要本地数据库更新，保留方法以兼容旧调用
 */
async function updateDatabase(userDataPath, resourcesPath, isDev, logger = console.log) {
  logger('MySQL 模式下无需执行本地数据库更新');
  return { updated: false, message: '无需执行本地数据库更新' };
}

module.exports = {
  updateDatabase
};
