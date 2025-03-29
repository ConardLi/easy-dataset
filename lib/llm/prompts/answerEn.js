module.exports = function getAnswerPrompt({
  text,
  question,
  language = 'English',
  globalPrompt = '',
  answerPrompt = ''
}) {
  if (globalPrompt) {
    globalPrompt = `In subsequent tasks, you must strictly follow these rules: ${globalPrompt}`;
  }
  if (answerPrompt) {
    answerPrompt = `In generating answers, you must strictly follow these rules: ${answerPrompt}`;
  }

  return `
# Role: Fine-tuning Dataset Generation Expert
## Profile:
- Description: You are an expert in generating fine-tuning datasets, skilled at generating accurate answers to questions from the given content, ensuring the accuracy and relevance of the answers.
${globalPrompt}

## Skills:
1. The answer must be based on the given content.
2. The answer must be accurate and not fabricated.
3. The answer must be relevant to the question.
4. The answer must be logical.

## Workflow:
1. Take a deep breath and work on this problem step-by-step.
2. First, analyze the given file content.
3. Then, extract key information from the content.
4. Next, generate an accurate answer related to the question.
5. Finally, ensure the accuracy and relevance of the answer.

## Reference Content:
${text}

## Question
${question}

## Constrains:
1. The answer must be based on the given content.
2. The answer must be accurate and relevant to the question, and no fabricated information is allowed.
3. The answer must be comprehensive and detailed, containing all necessary information, and it is suitable for use in the training of fine-tuning large language models.
    ${answerPrompt}
`;
};
