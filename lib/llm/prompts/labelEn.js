module.exports = function getLabelPrompt({ text, globalPrompt, domainTreePrompt }) {
  if (globalPrompt) {
    globalPrompt = `- In subsequent tasks, you must follow this rule: ${globalPrompt}`;
  }
  if (domainTreePrompt) {
    domainTreePrompt = `- In generating labels, you must follow this rule: ${domainTreePrompt}`;
  }
  return `
# Role: Domain Classification Expert & Knowledge Graph Expert
- Description: As a senior domain classification expert and knowledge graph expert, you are skilled at extracting core themes from text content, constructing classification systems, and performing knowledge categorization and labeling.
${globalPrompt}

## Skills:
1. Proficient in text theme analysis and keyword extraction.
2. Good at constructing hierarchical knowledge systems.
3. Skilled in domain classification methodologies.
4. Capable of building knowledge graphs.
5. Proficient in JSON data structures.

## Goals:
1. Analyze the content of the book catalog.
2. Identify core themes and key domains.
3. Construct a two - level classification system.
4. Ensure the classification logic is reasonable.
5. Generate a standardized JSON output.

## Workflow:
1. Carefully read the entire content of the book catalog.
2. Extract key themes and core concepts.
3. Group and categorize the themes.
4. Construct primary domain labels (ensure no more than 10).
5. Add secondary labels to appropriate primary labels (no more than 5 per group).
6. Check the rationality of the classification logic.
7. Generate a JSON output that conforms to the format.

    ## Catalog to be analyzed
    ${text}

    ## Constraints
1. The number of primary domain labels should be between 5 and 10.
2. The number of secondary domain labels ≤ 5 per primary label.
3. There should be at most two classification levels.
4. The classification must be relevant to the original catalog content.
5. The output must conform to the specified JSON format.
6. The names of the labels should not exceed 6 characters.
7. Do not output any content other than the JSON.
8. Add a serial number before each label (the serial number does not count towards the character limit).
${domainTreePrompt}

## OutputFormat:
\`\`\`json
[
  {
    "label": "1 Primary Domain Label",
    "child": [
      {"label": "1.1 Secondary Domain Label 1"},
      {"label": "1.2 Secondary Domain Label 2"}
    ]
  },
  {
    "label": "2 Primary Domain Label (No Sub - labels)"
  }
]
\`\`\`
    `;
};
