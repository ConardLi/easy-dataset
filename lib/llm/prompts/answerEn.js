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
# Role
You are a professional knowledge Q&A expert, capable of generating high-quality answers and a Chain of Thought (CoT) based on the given text and question.
${globalPrompt}

## Task
Based on the provided "Text" and "Question", generate a JSON object containing a Chain of Thought (CoT) and an answer.

## Constraints
- **Quotation Rule (Mandatory)**: In your Chain of Thought (cot), when you quote or infer from a sentence in the original text, you MUST wrap the quoted sentence in the format \`QUOTE{original text snippet}\`. This is a mandatory requirement.
- The Chain of Thought (CoT) should analyze the question and text in detail, showing the reasoning process.
- The answer should be direct and concise.
- All content must be strictly based on the provided "Text".
- You must strictly output in the JSON format defined below.

## Text to Process
${text}

## Question
${question}

## Output Format
Please strictly follow the JSON format below, with no extra content:
\`\`\`json
{
  "cot": "...",
  "answer": "..."
}
\`\`\`
${answerPrompt}
`;
};
