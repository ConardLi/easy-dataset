/**
 * Prompt for constructing questions based on tags
 * @param {string} tagPath - Tag chain, e.g., "Sports->Football->Football of the Year"
 * @param {string} currentTag - Current sub-tag, e.g., "Football of the Year"
 * @param {number} count - Number of questions to generate, e.g.: 10
 * @param {Array<string>} existingQuestions - Questions already generated for the current tag (to avoid duplicates)
 * @param {string} globalPrompt - Project-wide global prompt
 * @returns {string} Prompt
 */
export function distillQuestionsEnPrompt(tagPath, currentTag, count = 10, existingQuestions = [], globalPrompt = '') {
  const existingQuestionsText =
    existingQuestions.length > 0
      ? `Existing questions include:\n${existingQuestions.map(q => `- ${q}`).join('\n')}\nPlease do not generate duplicate questions.`
      : '';

  // Build the global prompt section
  const globalPromptText = globalPrompt ? `You must follow this requirement: ${globalPrompt}` : '';

  return `
You are a professional knowledge question generation assistant. I need you to generate ${count} high-quality questions for the tag "${currentTag}".

The full tag chain is: ${tagPath}

Please follow these rules:
${globalPromptText}
1. The generated questions should be closely related to the theme of "${currentTag}"
2. Questions should be educational and practical, helping people learn and understand the field
3. Questions should be clear and specific, avoiding vague or overly broad statements
4. Questions should have a certain depth and professionalism, but not be overly obscure
5. Questions can take diverse forms, including factual questions, conceptual questions, analytical questions, etc.
6. Questions should be open-ended to inspire thinking and discussion
${existingQuestionsText}

Please directly return the questions in JSON array format without any additional explanations or descriptions, in the following format:
["Question 1", "Question 2", "Question 3", ...]
`;
}
