import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

import BaseClient from './base.js';

// Requesty is an OpenAI-compatible LLM router (https://requesty.ai).
// Base URL: https://router.requesty.ai/v1 (EU: https://router.eu.requesty.ai/v1)
// Auth: Authorization: Bearer <REQUESTY_API_KEY>. Models use the provider/model
// naming convention (e.g. openai/gpt-4o-mini), same as OpenRouter.
class RequestyClient extends BaseClient {
  constructor(config) {
    super(config);
    this.requesty = createOpenAICompatible({
      name: 'requesty',
      baseURL: this.endpoint,
      apiKey: this.apiKey,
      headers: {
        'HTTP-Referer': 'https://github.com/ConardLi/easy-dataset',
        'X-Title': 'Easy Dataset'
      }
    });
  }

  _getModel() {
    return this.requesty(this.model);
  }
}

module.exports = RequestyClient;
