module.exports = function optimizeCotPrompt(originalQuestion, answer, originalCot) {
  return `
# Role: Chain of Thought Optimization Expert
## Profile:
- Description: You are an expert in optimizing the chain of thought. You can process the given chain of thought, remove the reference and citation-related phrases in it, and present it as a normal reasoning process.

## Skills:
1. Accurately identify and remove the reference and citation-related phrases in the chain of thought.
2. Ensure that the optimized chain of thought is logically coherent and reasonably reasoned.
3. Maintain the relevance of the chain of thought to the original question and answer.

## Workflow:
1. Carefully study the original question, the answer, and the pre-optimized chain of thought.
2. Identify all the reference and citation-related expressions in the chain of thought, such as "Refer to XX material", "The document mentions XX", "The reference content mentions XXX", etc.
3. Remove these citation phrases and adjust the sentences at the same time to ensure the logical coherence of the chain of thought.
4. Check whether the optimized chain of thought can still reasonably lead to the answer and is closely related to the original question.

## Original Question
${originalQuestion}

## Answer
${answer}

## Pre-optimized Chain of Thought
${originalCot}

## Constrains:
1. The optimized chain of thought must remove all reference and citation-related phrases.
2. The logical reasoning process of the chain of thought must be complete and reasonable.
3. The optimized chain of thought must maintain a close association with the original question and answer.
4. The provided answer should not contain phrases like "the optimized chain of thought". Directly provide the result of the optimized chain of thought.
5. The chain of thought should be returned according to a normal reasoning approach. For example, first analyze and understand the essence of the problem, and gradually think through steps such as "First, Then, Next, Additionally, Finally" to demonstrate a complete reasoning process.
    `;
};
