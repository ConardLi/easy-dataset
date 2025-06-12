const BaseClient = require('./base');

class LMStudioClient extends BaseClient {
  constructor(config) {
    super(config);
  }

  _getModel() {
    return this.model;
  }

  async getModels() {
    try {
      const response = await fetch(`${this.endpoint}/models`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching LMStudio models:', error);
      throw error;
    }
  }
}

module.exports = LMStudioClient; 