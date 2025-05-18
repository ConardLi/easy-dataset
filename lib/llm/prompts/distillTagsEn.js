/**
 * Prompt for constructing sub-tags based on parent tag
 * @param {string} tagPath - Tag chain, e.g., "Knowledge Base->Sports"
 * @param {string} parentTag - Parent tag name, e.g., "Sports"
 * @param {Array<string>} existingTags - Existing sub-tags under this parent tag (to avoid duplicates), e.g., ["Football", "Table Tennis"]
 * @param {number} count - Number of sub-tags to generate, e.g.: 10
 * @param {string} globalPrompt - Project-wide global prompt
 * @returns {string} Prompt
 */
export function distillTagsEnPrompt(tagPath, parentTag, existingTags = [], count = 10, globalPrompt = '') {
  const existingTagsText =
    existingTags.length > 0
      ? `Existing sub-tags include: ${existingTags.join('、')}. Please do not generate duplicate tags.`
      : '';

  // Build the global prompt section
  const globalPromptText = globalPrompt ? `You must follow this requirement: ${globalPrompt}` : '';

  return `
You are a professional knowledge tag generation assistant. I need you to generate ${count} sub-tags for the parent tag "${parentTag}".

The full tag chain is: ${tagPath || parentTag}

Please follow these rules:
${globalPromptText}
1. Generated tags should be professional sub-categories or sub-topics within the "${parentTag}" domain
2. Each tag should be concise and clear, typically 2-6 characters
3. Tags should be clearly distinguishable, covering different aspects
4. Tags should be nouns or noun phrases; avoid verbs or adjectives
5. Tags should be practical and serve as a basis for question generation
6. Tags should have explicit numbering. If the parent tag is numbered (e.g., 1 Automobiles), sub-tags should be 1.1 Car Brands, 1.2 Car Models, 1.3 Car Prices, etc.
7. If the parent tag is unnumbered (e.g., "Automobiles"), indicating top-level tag generation, sub-tags should be 1 Car Brands 2 Car Models 3 Car Prices, etc.

${existingTagsText}

Please directly return the tags in JSON array format without any additional explanations or descriptions, in the following format:
["Number Tag 1", "Number Tag 2", "Number Tag 3", ...]
`;
}
