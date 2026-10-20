import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const promptModuleUrl = new URL('../../../../lib/llm/prompts/multiTurnConversation.js', import.meta.url);
const promptLoaderModuleUrl = new URL('../../../../lib/llm/common/prompt-loader.js', import.meta.url);
const [promptSource, promptLoaderSource] = await Promise.all([
  readFile(promptModuleUrl, 'utf8'),
  readFile(promptLoaderModuleUrl, 'utf8')
]);
const customPromptCalls = [];

const customPromptsDb = new vm.SyntheticModule(['getCustomPrompt'], function () {
  this.setExport(
    'getCustomPrompt',
    async (projectId, promptType, promptKey, language) => {
      customPromptCalls.push({ projectId, promptType, promptKey, language });
      const roundPlaceholder = promptKey.startsWith('ASSISTANT') ? 'currentRound' : 'nextRound';
      return {
        isActive: true,
        content:
          `Custom prompt: {{scenario}} | {{roleA}} | {{roleB}} | {{chunkContent}} | ` +
          `{{conversationHistory}} | {{${roundPlaceholder}}} | {{totalRounds}}`
      };
    }
  );
});

const promptLoaderModule = new vm.SourceTextModule(promptLoaderSource, {
  identifier: promptLoaderModuleUrl.href
});
await promptLoaderModule.link(async specifier => {
  assert.equal(specifier, '@/lib/db/custom-prompts');
  return customPromptsDb;
});

const promptModule = new vm.SourceTextModule(promptSource, { identifier: promptModuleUrl.href });
await promptModule.link(async specifier => {
  assert.equal(specifier, '../common/prompt-loader');
  return promptLoaderModule;
});
await promptModule.evaluate();

const { getAssistantReplyPrompt, getNextQuestionPrompt } = promptModule.namespace;
const baseParams = {
  scenario: 'Product consultation',
  roleA: 'Customer',
  roleB: 'Specialist',
  conversationHistory: 'Customer: What does it do?',
  totalRounds: 3
};

const helpers = [
  {
    name: 'assistant reply',
    helper: getAssistantReplyPrompt,
    roundKey: 'currentRound',
    baseKey: 'ASSISTANT_REPLY_PROMPT'
  },
  {
    name: 'next question',
    helper: getNextQuestionPrompt,
    roundKey: 'nextRound',
    baseKey: 'NEXT_QUESTION_PROMPT'
  }
];

for (const { name, helper, roundKey } of helpers) {
  for (const [language, chunkContent] of [
    ['zh', '中文原文：这款设备支持离线处理。'],
    ['en', 'English source: this device supports offline processing.']
  ]) {
    test(`${name} preserves non-empty ${language} source text`, async () => {
      const prompt = await helper(language, {
        ...baseParams,
        [roundKey]: 2,
        chunkContent
      });

      assert.ok(prompt.includes(chunkContent));
    });
  }
}

const fallbacks = {
  en: 'No reference materials available. Please generate a reply based on your own knowledge.',
  tr: 'Kullanılabilir referans materyal yok. Lütfen kendi bilginize dayalı bir yanıt oluşturun.',
  zh: '没有可用的参考资料，请根据自己的知识直接生成回复'
};
const distillationPlaceholder =
  'This text block is used to store questions generated through data distillation.';

for (const { name, helper, roundKey } of helpers) {
  for (const [language, fallback] of Object.entries(fallbacks)) {
    for (const [caseName, chunkContent] of [
      ['empty content', ''],
      ['distillation placeholder', distillationPlaceholder]
    ]) {
      test(`${name} uses the ${language} fallback for ${caseName}`, async () => {
        const prompt = await helper(language, {
          ...baseParams,
          [roundKey]: 2,
          chunkContent
        });

        assert.ok(prompt.includes(fallback));
      });
    }
  }
}

for (const { name, helper, roundKey, baseKey } of helpers) {
  test(`${name} forwards all parameters to a custom project prompt`, async () => {
    const params = {
      ...baseParams,
      [roundKey]: 2,
      chunkContent: `${name} custom source`
    };
    const prompt = await helper('en', params, 'project-767');
    const call = customPromptCalls.at(-1);

    assert.equal(
      prompt,
      `Custom prompt: ${params.scenario} | ${params.roleA} | ${params.roleB} | ${params.chunkContent} | ` +
        `${params.conversationHistory} | ${params[roundKey]} | ${params.totalRounds}`
    );
    assert.deepEqual(call, {
      projectId: 'project-767',
      promptType: 'multiTurnConversation',
      promptKey: `${baseKey}_EN`,
      language: 'en'
    });
  });
}
