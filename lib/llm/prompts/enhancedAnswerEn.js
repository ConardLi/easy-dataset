/**
 * Enhanced answer generation prompt template - based on GA pairs
 * @param {Object} params - Parameter object
 * @param {string} params.text - Reference text content
 * @param {string} params.question - Question content
 * @param {string} params.language - Language
 * @param {string} params.globalPrompt - Global prompt
 * @param {string} params.answerPrompt - Answer prompt
 * @param {Array} params.gaPairs - GA pairs array containing genre and audience information
 * @param {Object} params.activeGaPair - Currently active GA pair
 */
export default function getEnhancedAnswerEnPrompt({
  text,
  question,
  globalPrompt = '',
  answerPrompt = '',
  activeGaPair = null
}) {
  if (globalPrompt) {
    globalPrompt = `In subsequent tasks, you must strictly follow these rules: ${globalPrompt}`;
  }
  if (answerPrompt) {
    answerPrompt = `In generating answers, you must strictly follow these rules: ${answerPrompt}`;
  }

  let gaPrompt = '';
  if (activeGaPair && activeGaPair.active) {
    gaPrompt = `
## Special Requirements - Genre & Audience Adaptation (MGA):
Adjust your response style and depth according to the following genre and audience combination:
- **Current Genre**: ${activeGaPair.genre}
- **Target Audience**: ${activeGaPair.audience}
`;
  }

  return `
# Role
You are a professional knowledge Q&A expert, capable of generating high-quality answers and a Chain of Thought (CoT) based on the given text, question, and style requirements.
${globalPrompt}

## Task
Based on the provided "Text", "Question", and "Special Requirements", generate a JSON object containing a Chain of Thought (CoT) and an answer.

${gaPrompt}

## Core Constraints
- **Quotation Rule (Mandatory)**: In your Chain of Thought (cot), when you quote or infer from a sentence in the original text, you MUST wrap the quoted sentence in the format \`QUOTE{original text snippet}\`. This is a mandatory requirement.
- The CoT should analyze the question and text in detail, showing the reasoning process and reflecting an understanding of the "Special Requirements".
- The answer should be direct, concise, and adhere to the style specified in the "Special Requirements".
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
}
