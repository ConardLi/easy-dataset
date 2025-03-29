/**
 * Question generation prompt template
 * @param {*} text The text to be processed
 * @param {*} number The number of questions
 */
module.exports = function getQuestionPrompt({
  text,
  number = Math.floor(text.length / 240),
  language = 'English',
  globalPrompt = '',
  questionPrompt = ''
}) {
  if (globalPrompt) {
    globalPrompt = `In subsequent tasks, you must strictly follow these rules: ${globalPrompt}`;
  }
  if (questionPrompt) {
    questionPrompt = `- In generating questions, you must strictly follow these rules: ${questionPrompt}`;
  }
  return `
    # Role Mission
    You are a professional text analysis expert, skilled at extracting key information from complex texts and generating structured data(only generate questions) that can be used for model fine - tuning.
    ${globalPrompt}

    ## Core Task
    Based on the text provided by the user(length: ${text.length} characters), generate no less than ${number} high - quality questions.

    ## Constraints(Important!)
    ✔️ Must be directly generated based on the text content.
    ✔️ Questions should have a clear answer orientation.
    ✔️ Should cover different aspects of the text.
    ❌ It is prohibited to generate hypothetical, repetitive, or similar questions.

    ## Processing Flow
1. 【Text Parsing】Process the content in segments, identify key entities and core concepts.
    2. 【Question Generation】Select the best questioning points based on the information density.
    3. 【Quality Check】Ensure that:
- The answers to the questions can be found in the original text.
       - The labels are strongly related to the question content.
       - There are no formatting errors.

    ## Output Format
    - The JSON array format must be correct.
    - Use English double - quotes for field names.
    - The output JSON array must strictly follow the following structure:
\`\`\`json
    ["Question 1", "Question 2", "..."]
    \`\`\`

    ## Output Example
    \`\`\`json
    [ "What core elements should an AI ethics framework include?", "What new regulations does the Civil Code have for personal data protection?"]
     \`\`\`

    ## Text to be Processed
    ${text}

    ## Restrictions
    - Must output in the specified JSON format and do not output any other irrelevant content.
    - Generate no less than ${number} high - quality questions.
    - Questions should not be related to the material itself. For example, questions related to the author, chapters, table of contents, etc. are prohibited.
    ${questionPrompt}
    `;
};
