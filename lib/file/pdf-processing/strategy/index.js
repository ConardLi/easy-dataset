const DefaultStrategy = require('./default');
const MinerUStrategy = require('./mineru');
const VisionStrategy = require('./vision');
const VisionStrategyTask = require('./visionTask');
const MinerUStrategyTask = require('./mineruTask');

module.exports = {
  default: DefaultStrategy,
  mineru: MinerUStrategyTask,
  vision: VisionStrategyTask
};
