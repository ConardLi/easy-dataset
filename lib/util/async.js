// 并行处理数组的辅助函数，限制并发数
export const processInParallel = async (items, processFunction, concurrencyLimit, onProgress) => {
  const results = [];
  const inProgress = new Set();
  const queue = [...items];
  let completedCount = 0;

  while (queue.length > 0 || inProgress.size > 0) {
    // 如果有空闲槽位且队列中还有任务，启动新任务
    while (inProgress.size < concurrencyLimit && queue.length > 0) {
      const item = queue.shift();
      const promise = processFunction(item).then(result => {
        inProgress.delete(promise);
        onProgress && onProgress(++completedCount, items.length);
        return result;
      });
      inProgress.add(promise);
      results.push(promise);
    }

    // 等待其中一个任务完成
    if (inProgress.size > 0) {
      await Promise.race(inProgress);
    }
  }

  return Promise.all(results);
};
