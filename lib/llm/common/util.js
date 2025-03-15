// 从 LLM 输出中提取 JSON
function extractJsonFromLLMOutput(output) {
    // 先尝试直接 parse
    try {
        const json = JSON.parse(output);
        return json;
    } catch { }
    const jsonStart = output.indexOf('```json');
    const jsonEnd = output.lastIndexOf('```');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = output.substring(jsonStart + 7, jsonEnd);
        try {
            const json = JSON.parse(jsonString);
            return json;
        } catch (error) {
            console.error('解析 JSON 时出错:', error);
        }
    }
}

function extractThinkChain(text) {
    const startTags = ["<think>", "<thinking>"];
    const endTags = ["</think>", "</thinking>"];
    let startIndex = -1;
    let endIndex = -1;
    let usedStartTag = "";
    let usedEndTag = "";

    for (let i = 0; i < startTags.length; i++) {
        const currentStartIndex = text.indexOf(startTags[i]);
        if (currentStartIndex !== -1) {
            startIndex = currentStartIndex;
            usedStartTag = startTags[i];
            usedEndTag = endTags[i];
            break;
        }
    }

    if (startIndex === -1) {
        return "";
    }

    endIndex = text.indexOf(usedEndTag, startIndex + usedStartTag.length);

    if (endIndex === -1) {
        return "";
    }

    return text.slice(startIndex + usedStartTag.length, endIndex).trim();
}

function extractAnswer(text) {
    const startTags = ["<think>", "<thinking>"];
    const endTags = ["</think>", "</thinking>"];
    for (let i = 0; i < startTags.length; i++) {
        const start = startTags[i];
        const end = endTags[i];
        if (text.includes(start) && text.includes(end)) {
            const partsBefore = text.split(start);
            const partsAfter = partsBefore[1].split(end);
            return (partsBefore[0].trim() + " " + partsAfter[1].trim()).trim();
        }
    }
    return text;
}

module.exports = {
    extractJsonFromLLMOutput,
    extractThinkChain,
    extractAnswer
}