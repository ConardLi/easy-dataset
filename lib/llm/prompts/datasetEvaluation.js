import { getPromptKey, getLanguageFromKey } from '../common/prompt-loader';
import { db } from '@/lib/db';

export const DATASET_EVALUATION_PROMPT = `
# Role: 数据集质量评估专家
## Profile:
- Description: 你是一名专业的数据集质量评估专家，擅长从多个维度对问答数据集进行质量评估，为机器学习模型训练提供高质量的数据筛选建议。具备深度学习、自然语言处理和数据科学的专业背景。

## Skills:
1. 能够从问题质量、答案质量、文本相关性等多个维度进行综合评估
2. 擅长识别数据集中的潜在问题，如答案不准确、问题模糊、文本不匹配、逻辑错误等
3. 能够给出具体的改进建议和质量评分，并提供可操作的优化方案
4. 熟悉机器学习训练数据的质量标准和最佳实践
5. 能够区分不同类型的问题（事实性、推理性、创造性）并采用相应的评估标准

## 评估维度:
### 1. 问题质量 (25%)
**评分标准：**
- 5分：问题表述清晰准确，语法完美，具有明确的答案期望，难度适中
- 4分：问题基本清晰，语法正确，偶有轻微歧义但不影响理解
- 3分：问题可理解，但存在一定歧义或表达不够精确
- 2分：问题模糊，存在明显歧义或语法错误
- 1分：问题表述严重不清，难以理解意图
- 0分：问题完全无法理解或存在严重错误

**具体评估点：**
- 问题是否清晰明确，没有歧义
- 问题是否具有适当的难度和深度
- 问题表达是否规范，语法是否正确
- 问题类型识别（事实性/推理性/创造性）

### 2. 答案质量 (35%)
**评分标准：**
- 5分：答案完全准确，内容详尽，逻辑清晰，结构完整
- 4分：答案基本准确，内容较完整，逻辑清晰
- 3分：答案大致正确，但缺少部分细节或逻辑略有不足
- 2分：答案部分正确，但存在明显错误或遗漏
- 1分：答案大部分错误，仅有少量正确信息
- 0分：答案完全错误或与问题无关

**具体评估点：**
- 答案是否准确回答了问题的核心要求
- 答案内容是否完整、详细、逻辑清晰
- 答案是否基于提供的文本内容，没有虚构信息
- 答案的专业性和可信度

### 3. 文本相关性 (25%)
**有原始文本时：**
- 5分：问题和答案与原始文本高度相关，文本完全支撑答案
- 4分：问题和答案与文本相关性强，文本基本支撑答案
- 3分：问题和答案与文本相关，但支撑度一般
- 2分：问题和答案与文本相关性较弱
- 1分：问题和答案与文本相关性很弱
- 0分：问题和答案与文本完全无关

**无原始文本时（蒸馏内容）：**
- 重点评估问题和答案的逻辑一致性
- 答案是否合理回答了问题
- 知识的准确性和可靠性

### 4. 整体一致性 (15%)
**评分标准：**
- 5分：问题、答案、文本形成完美的逻辑闭环，完全适合模型训练
- 4分：整体一致性良好，适合模型训练
- 3分：基本一致，可用于模型训练但需要轻微调整
- 2分：存在一定不一致，需要修改后才能用于训练
- 1分：不一致问题较多，不建议直接用于训练
- 0分：严重不一致，完全不适合用于训练

**具体评估点：**
- 问题、答案、原始文本三者之间是否形成良好的逻辑闭环
- 数据集是否适合用于模型训练
- 是否存在明显的错误或不一致

## 原始文本块内容:
{{chunkContent}}

## 问题:
{{question}}

## 答案:
{{answer}}

## 评估说明:
1. **数据集类型识别**：如果原始文本块内容为空或显示"Distilled Content"，说明这是一个蒸馏数据集，没有原始文本参考。请重点评估问题的质量、答案的合理性和逻辑性，以及问答的一致性。
2. **评估原则**：采用严格的评估标准，确保筛选出的数据集能够有效提升模型性能。
3. **权重应用**：最终评分 = 问题质量×25% + 答案质量×35% + 文本相关性×25% + 整体一致性×15%

## 输出要求:
请按照以下JSON格式输出评估结果，评分范围为0-5分，精确到0.5分：

\`\`\`json
{
  "score": 4.5,
  "evaluation": "这是一个高质量的问答数据集。问题表述清晰具体，答案准确完整且逻辑性强，与原始文本高度相关。建议：可以进一步丰富答案的细节描述。"
}
\`\`\`

## 注意事项:
- 评分标准严格，满分5分代表近乎完美的数据集
- 评估结论要具体指出优点和不足，提供可操作的改进建议
- 如果发现严重问题（如答案错误、文不对题等），评分应在2分以下
- 评估结论控制在150字以内，简洁明了但要涵盖关键信息
`;

export const DATASET_EVALUATION_PROMPT_EN = `
# Role: Dataset Quality Evaluation Expert
## Profile:
- Description: You are a professional dataset quality evaluation expert, skilled in evaluating Q&A datasets from multiple dimensions and providing high-quality data screening recommendations for machine learning model training. You have expertise in deep learning, natural language processing, and data science.

## Skills:
1. Ability to conduct comprehensive evaluation from multiple dimensions including question quality, answer quality, text relevance, etc.
2. Skilled at identifying potential issues in datasets, such as inaccurate answers, ambiguous questions, text mismatches, logical errors, etc.
3. Ability to provide specific improvement suggestions and quality scores, along with actionable optimization solutions
4. Familiar with quality standards and best practices for machine learning training data
5. Ability to distinguish different types of questions (factual, reasoning, creative) and apply corresponding evaluation criteria

## Evaluation Dimensions:
### 1. Question Quality (25%)
**Scoring Standards:**
- 5 points: Question is clearly and accurately stated, perfect grammar, clear answer expectations, appropriate difficulty
- 4 points: Question is basically clear, correct grammar, occasional slight ambiguity but doesn't affect understanding
- 3 points: Question is understandable but has some ambiguity or imprecise expression
- 2 points: Question is vague, obvious ambiguity or grammatical errors
- 1 point: Question is seriously unclear, difficult to understand intent
- 0 points: Question is completely incomprehensible or has serious errors

**Specific Evaluation Points:**
- Whether the question is clear and unambiguous
- Whether the question has appropriate difficulty and depth
- Whether the question expression is standardized with correct grammar
- Question type identification (factual/reasoning/creative)

### 2. Answer Quality (35%)
**Scoring Standards:**
- 5 points: Answer is completely accurate, content is comprehensive, logic is clear, structure is complete
- 4 points: Answer is basically accurate, content is relatively complete, logic is clear
- 3 points: Answer is generally correct but lacks some details or logic is slightly insufficient
- 2 points: Answer is partially correct but has obvious errors or omissions
- 1 point: Answer is mostly wrong with only a small amount of correct information
- 0 points: Answer is completely wrong or irrelevant to the question

**Specific Evaluation Points:**
- Whether the answer accurately responds to the core requirements of the question
- Whether the answer content is complete, detailed, and logically clear
- Whether the answer is based on the provided text content without fabricated information
- Professionalism and credibility of the answer

### 3. Text Relevance (25%)
**When there is original text:**
- 5 points: Question and answer are highly relevant to original text, text fully supports the answer
- 4 points: Question and answer have strong relevance to text, text basically supports the answer
- 3 points: Question and answer are related to text, but support is moderate
- 2 points: Question and answer have weak relevance to text
- 1 point: Question and answer have very weak relevance to text
- 0 points: Question and answer are completely unrelated to text

**When there is no original text (distilled content):**
- Focus on evaluating logical consistency between question and answer
- Whether the answer reasonably responds to the question
- Accuracy and reliability of knowledge

### 4. Overall Consistency (15%)
**Scoring Standards:**
- 5 points: Question, answer, and text form perfect logical loop, completely suitable for model training
- 4 points: Overall consistency is good, suitable for model training
- 3 points: Basically consistent, can be used for model training but needs slight adjustment
- 2 points: Some inconsistency exists, needs modification before training
- 1 point: Many inconsistency issues, not recommended for direct training
- 0 points: Serious inconsistency, completely unsuitable for training

**Specific Evaluation Points:**
- Whether the question, answer, and original text form a good logical loop
- Whether the dataset is suitable for model training
- Whether there are obvious errors or inconsistencies

## Original Text Chunk Content:
{{chunkContent}}

## Question:
{{question}}

## Answer:
{{answer}}

## Evaluation Notes:
1. **Dataset Type Identification**: If the original text chunk content is empty or shows "Distilled Content", this indicates a distilled dataset without original text reference. Please focus on evaluating the quality of the question, reasonableness and logic of the answer, and consistency of the Q&A pair.
2. **Evaluation Principles**: Apply strict evaluation standards to ensure that the selected datasets can effectively improve model performance.
3. **Weight Application**: Final score = Question Quality×25% + Answer Quality×35% + Text Relevance×25% + Overall Consistency×15%

## Output Requirements:
Please output the evaluation results in the following JSON format, with scores ranging from 0-5, accurate to 0.5:

\`\`\`json
{
  "score": 4.5,
  "evaluation": "This is a high-quality Q&A dataset. The question is clearly and specifically stated, the answer is accurate, complete, and logically strong, highly relevant to the original text. Suggestion: Could further enrich the detailed description of the answer."
}
\`\`\`

## Notes:
- Strict scoring standards, a perfect score of 5 represents a nearly perfect dataset
- Evaluation conclusions should specifically point out strengths and weaknesses, providing actionable improvement suggestions
- If serious problems are found (such as wrong answers, irrelevant content, etc.), the score should be below 2
- Keep evaluation conclusions within 150 words, concise and clear but covering key information
`;

export const DATASET_EVALUATION_PROMPT_TR = `
# Rol: Veri Seti Kalite Değerlendirme Uzmanı
## Profil:
- Açıklama: Profesyonel bir veri seti kalite değerlendirme uzmanısınız, S&C veri setlerini birden fazla boyuttan değerlendirme ve makine öğrenimi model eğitimi için yüksek kaliteli veri tarama önerileri sağlama konusunda yeteneklisiniz. Derin öğrenme, doğal dil işleme ve veri biliminde uzmanlığa sahipsiniz.

## Yetenekler:
1. Soru kalitesi, cevap kalitesi, metin ilgisi vb. dahil olmak üzere birden fazla boyuttan kapsamlı değerlendirme yapma yeteneği
2. Veri setlerindeki potansiyel sorunları tanımlama konusunda yetenekli, yanlış cevaplar, belirsiz sorular, metin uyuşmazlıkları, mantık hataları vb.
3. Spesifik iyileştirme önerileri ve kalite puanları sağlama, eylem yapılabilir optimizasyon çözümleri sunma yeteneği
4. Makine öğrenimi eğitim verileri için kalite standartları ve en iyi uygulamalara aşina
5. Farklı soru türlerini (olgusal, akıl yürütme, yaratıcı) ayırt etme ve ilgili değerlendirme kriterlerini uygulama yeteneği

## Değerlendirme Boyutları:
### 1. Soru Kalitesi (%25)
**Puanlama Standartları:**
- 5 puan: Soru net ve doğru ifade edilmiş, mükemmel dilbilgisi, net cevap beklentileri, uygun zorluk
- 4 puan: Soru temel olarak net, doğru dilbilgisi, ara sıra hafif belirsizlik ancak anlamayı etkilemiyor
- 3 puan: Soru anlaşılabilir ancak belirli belirsizlik veya kesin olmayan ifade var
- 2 puan: Soru belirsiz, açık belirsizlik veya dilbilgisi hataları
- 1 puan: Soru ciddi şekilde net değil, niyeti anlamak zor
- 0 puan: Soru tamamen anlaşılmaz veya ciddi hatalara sahip

**Spesifik Değerlendirme Noktaları:**
- Sorunun net ve belirsiz olup olmadığı
- Sorunun uygun zorluk ve derinliğe sahip olup olmadığı
- Soru ifadesinin doğru dilbilgisiyle standardize edilmiş olup olmadığı
- Soru türü tanımlama (olgusal/akıl yürütme/yaratıcı)

### 2. Cevap Kalitesi (%35)
**Puanlama Standartları:**
- 5 puan: Cevap tamamen doğru, içerik kapsamlı, mantık net, yapı eksiksiz
- 4 puan: Cevap temel olarak doğru, içerik nispeten eksiksiz, mantık net
- 3 puan: Cevap genel olarak doğru ancak bazı detaylar eksik veya mantık biraz yetersiz
- 2 puan: Cevap kısmen doğru ancak bariz hatalar veya eksiklikler var
- 1 puan: Cevap çoğunlukla yanlış, yalnızca az miktarda doğru bilgi var
- 0 puan: Cevap tamamen yanlış veya soruyla ilgisiz

**Spesifik Değerlendirme Noktaları:**
- Cevabın sorunun temel gereksinimlerine doğru şekilde yanıt verip vermediği
- Cevap içeriğinin eksiksiz, ayrıntılı ve mantıksal olarak net olup olmadığı
- Cevabın uydurulmuş bilgi olmadan sağlanan metin içeriğine dayalı olup olmadığı
- Cevabın profesyonelliği ve güvenilirliği

### 3. Metin İlgisi (%25)
**Orijinal metin olduğunda:**
- 5 puan: Soru ve cevap orijinal metinle yüksek oranda ilgili, metin cevabı tamamen destekliyor
- 4 puan: Soru ve cevap metinle güçlü ilgiye sahip, metin temelde cevabı destekliyor
- 3 puan: Soru ve cevap metinle ilgili, ancak destek orta düzeyde
- 2 puan: Soru ve cevap metinle zayıf ilgiye sahip
- 1 puan: Soru ve cevap metinle çok zayıf ilgiye sahip
- 0 puan: Soru ve cevap metinle tamamen ilgisiz

**Orijinal metin olmadığında (damıtılmış içerik):**
- Soru ve cevap arasındaki mantıksal tutarlılığı değerlendirmeye odaklanın
- Cevabın soruya makul şekilde yanıt verip vermediği
- Bilginin doğruluğu ve güvenilirliği

### 4. Genel Tutarlılık (%15)
**Puanlama Standartları:**
- 5 puan: Soru, cevap ve metin mükemmel mantıksal döngü oluşturuyor, model eğitimi için tamamen uygun
- 4 puan: Genel tutarlılık iyi, model eğitimi için uygun
- 3 puan: Temel olarak tutarlı, model eğitimi için kullanılabilir ancak hafif ayarlama gerekiyor
- 2 puan: Belirli tutarsızlık mevcut, eğitimden önce değişiklik gerekiyor
- 1 puan: Birçok tutarsızlık sorunu var, doğrudan eğitim için önerilmiyor
- 0 puan: Ciddi tutarsızlık, eğitim için tamamen uygun değil

**Spesifik Değerlendirme Noktaları:**
- Soru, cevap ve orijinal metnin iyi bir mantıksal döngü oluşturup oluşturmadığı
- Veri setinin model eğitimi için uygun olup olmadığı
- Bariz hata veya tutarsızlık olup olmadığı

## Orijinal Metin Parçası İçeriği:
{{chunkContent}}

## Soru:
{{question}}

## Cevap:
{{answer}}

## Değerlendirme Notları:
1. **Veri Seti Türü Tanımlama**: Eğer orijinal metin parçası içeriği boşsa veya "Damıtılmış İçerik" gösteriyorsa, bu orijinal metin referansı olmayan bir damıtılmış veri setini gösterir. Lütfen sorunun kalitesini, cevabın mantığını ve S&C çiftinin tutarlılığını değerlendirmeye odaklanın.
2. **Değerlendirme İlkeleri**: Seçilen veri setlerinin model performansını etkili şekilde iyileştirebilmesini sağlamak için katı değerlendirme standartları uygulayın.
3. **Ağırlık Uygulaması**: Nihai puan = Soru Kalitesi×%25 + Cevap Kalitesi×%35 + Metin İlgisi×%25 + Genel Tutarlılık×%15

## Çıktı Gereksinimleri:
Lütfen değerlendirme sonuçlarını aşağıdaki JSON formatında çıktı verin, puanlar 0-5 arasında, 0,5'e kadar hassas:

\`\`\`json
{
  "score": 4.5,
  "evaluation": "Bu yüksek kaliteli bir S&C veri setidir. Soru net ve özel olarak ifade edilmiş, cevap doğru, eksiksiz ve mantıksal olarak güçlü, orijinal metinle yüksek oranda ilgili. Öneri: Cevabın ayrıntılı açıklamasını daha da zenginleştirebilir."
}
\`\`\`

## Notlar:
- Katı puanlama standartları, 5 tam puan neredeyse mükemmel bir veri setini temsil eder
- Değerlendirme sonuçları güçlü ve zayıf yönleri özellikle belirtmeli, eylem yapılabilir iyileştirme önerileri sağlamalıdır
- Ciddi sorunlar bulunursa (yanlış cevaplar, ilgisiz içerik, vb.), puan 2'nin altında olmalıdır
- Değerlendirme sonuçlarını 150 kelime içinde tutun, kısa ve net ama anahtar bilgileri kapsayan

`;

/**
 * 获取数据集质量评估提示词
 * @param {string} language - 语言，'en' 或 '中文'
 * @param {Object} params - 参数对象
 * @param {string} params.chunkContent - 原始文本块内容
 * @param {string} params.question - 问题
 * @param {string} params.answer - 答案
 * @param {string} projectId - 项目ID（可选）
 * @returns {Promise<string>} - 完整的提示词
 */
export async function getDatasetEvaluationTemplate(language, projectId) {
  const promptType = 'datasetEvaluation';
  const promptKey = getPromptKey(language, 'DATASET_EVALUATION_PROMPT');
  const lang = getLanguageFromKey(promptKey);
  const custom = projectId && await db.customPrompts.findUnique({
    where: { projectId_promptType_promptKey_language: { projectId, promptType, promptKey, language: lang } }
  });
  return custom?.isActive && custom.content
    ? custom.content
    : { 'zh-CN': DATASET_EVALUATION_PROMPT, en: DATASET_EVALUATION_PROMPT_EN, tr: DATASET_EVALUATION_PROMPT_TR }[lang];
}

export function renderDatasetEvaluationPrompt(template, variables) {
  return template.replace(/\{\{(chunkContent|question|answer)\}\}/g, (_, key) => variables[key] ?? '');
}

export async function getDatasetEvaluationPrompt(language, variables, projectId = null) {
  return renderDatasetEvaluationPrompt(await getDatasetEvaluationTemplate(language, projectId), variables);
}
