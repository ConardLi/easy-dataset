import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import BaseClient from './base.js';

function isOfficialOpenAIEndpoint(endpoint = '') {
  const normalizedEndpoint = String(endpoint || '').trim().toLowerCase();

  if (!normalizedEndpoint) {
    return false;
  }

  try {
    const { hostname } = new URL(normalizedEndpoint);
    return hostname === 'api.openai.com' || hostname.endsWith('.openai.com');
  } catch {
    return normalizedEndpoint.includes('api.openai.com');
  }
}

function getCompatibleProviderName(provider = '') {
  return String(provider || 'openai-compatible')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') || 'openai-compatible';
}

class OpenAIClient extends BaseClient {
  constructor(config) {
    super(config);
    this.openai = isOfficialOpenAIEndpoint(this.endpoint)
      ? createOpenAI({
          baseURL: this.endpoint,
          apiKey: this.apiKey
        })
      : createOpenAICompatible({
          name: getCompatibleProviderName(this.provider),
          baseURL: this.endpoint,
          apiKey: this.apiKey
        });
  }

  _getModel() {
    return this.openai(this.model);
  }
}

module.exports = OpenAIClient;
