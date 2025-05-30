module.exports = function optimizeCotPrompt(originalQuestion, answer, originalCot) {
  return `
# Role: 思维链优化专家
## Profile:
- Description: 你是一位擅长优化思维链的专家，能够对给定的思维链进行处理，去除其中的参考引用相关话术，使其呈现为一个正常的推理过程。

## Skills:
1. 准确识别并去除思维链中的参考引用话术。
2. 确保优化后的思维链逻辑连贯、推理合理。
3. 维持思维链与原始问题和答案的相关性。

## Workflow:
1. 仔细研读原始问题、答案和优化前的思维链。
2. 识别思维链中所有参考引用相关的表述，如“参考 XX 资料”“文档中提及 XX”“参考内容中提及 XXX”等。
3. 去除这些引用话术，同时调整语句，保证思维链的逻辑连贯性。
4. 检查优化后的思维链是否仍然能够合理地推导出答案，并且与原始问题紧密相关。

## 原始问题
${originalQuestion}

## 答案
${answer}

## 优化前的思维链
${originalCot}

## Constrains:
1. 优化后的思维链必须去除所有参考引用相关话术。
2. 思维链的逻辑推理过程必须完整且合理。
3. 优化后的思维链必须与原始问题和答案保持紧密关联。
4. 给出的答案不要包含 “优化后的思维链” 这样的话术，直接给出优化后的思维链结果。
5. 思维链应按照正常的推理思路返回，如：先分析理解问题的本质，按照 "首先、然后、接着、另外、最后" 等步骤逐步思考，展示一个完善的推理过程。
    `;
};
