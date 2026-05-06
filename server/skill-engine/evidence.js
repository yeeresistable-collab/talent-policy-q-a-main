function hasAnyTag(chunk, tags) {
  return tags.some((tag) => chunk.tags.includes(tag));
}

function normalizeForMatch(text) {
  return String(text ?? "").replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, "").toLowerCase();
}

const QUERY_STOPWORDS = new Set([
  "什么",
  "怎么",
  "如何",
  "哪里",
  "哪个",
  "是否",
  "需要",
  "可以",
  "吗",
  "呢",
  "呀",
  "请问",
  "办理",
  "申请",
  "材料",
  "流程",
  "问题",
  "相关",
  "内容",
  "情况",
  "说明",
  "介绍",
  "一下",
  "一下子",
]);

function hasFaqLikeQuestion(text) {
  return /[？?]|是否|需不需要|需要.*吗|要不要|能不能|可不可以/.test(text);
}

function extractQueryTokens(text) {
  return Array.from(
    new Set(
      String(text ?? "")
        .replace(/[，。！？、；：“”"'（）()\[\]{}<>《》]/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2 && !QUERY_STOPWORDS.has(token)),
    ),
  );
}

function isHighConfidenceFaqMatch(chunk, question) {
  if (!chunk.tags.includes("faq")) return false;
  const normalizedQuestion = normalizeForMatch(question);
  const normalizedTitle = normalizeForMatch(chunk.title);
  if (!normalizedQuestion || !normalizedTitle) return false;
  return (
    normalizedTitle.includes(normalizedQuestion) ||
    normalizedQuestion.includes(normalizedTitle)
  );
}

function businessTags(slots) {
  const tags = [];
  if (slots.business_type === "employer") tags.push("employer");
  if (slots.business_type === "extension") tags.push("extension");
  if (slots.business_type === "change") tags.push("change");
  if (slots.business_type === "cancellation") tags.push("cancellation");
  if (slots.business_type === "confirmationLetter") tags.push("confirmationLetter");
  if (slots.business_type === "new" || slots.duration === "longTerm") tags.push("longTerm");
  if (slots.duration === "shortTerm") tags.push("shortTerm");
  if (slots.location === "domestic") tags.push("domestic");
  if (slots.location === "overseas") tags.push("overseas");
  return tags;
}

function intentTags(intent) {
  if (intent === "materials") return ["materials"];
  if (intent === "process") return ["process"];
  if (intent === "time") return ["time"];
  if (intent === "windows") return ["windows"];
  if (intent === "convenience") return ["convenience"];
  if (intent === "tax") return ["tax"];
  if (intent === "definition") return ["definition", "condition"];
  return [];
}

function scoreChunk(chunk, runtime) {
  let score = 0;
  let matchedTokenCount = 0;
  const text = `${chunk.title}\n${chunk.content}`;
  const requiredIntentTags = intentTags(runtime.intent);
  const requiredBusinessTags = businessTags(runtime.slots);
  const normalizedQuestion = normalizeForMatch(runtime.semanticQuestion);
  const normalizedTitle = normalizeForMatch(chunk.title);

  if (requiredIntentTags.length > 0 && hasAnyTag(chunk, requiredIntentTags)) score += 60;
  if (requiredBusinessTags.length > 0 && hasAnyTag(chunk, requiredBusinessTags)) score += 50;
  if (
    normalizedQuestion &&
    normalizedTitle &&
    (normalizedTitle.includes(normalizedQuestion) || normalizedQuestion.includes(normalizedTitle))
  ) {
    score += 220;
  }
  if (chunk.tags.includes("faq") && hasFaqLikeQuestion(runtime.semanticQuestion)) {
    score += 80;
  }

  if (runtime.isAClassDefinition) {
    if (hasAnyTag(chunk, ["confirmationLetter", "definition", "condition"])) score += 120;
    if (hasAnyTag(chunk, ["convenience", "tax", "time", "materials", "longTerm"])) score -= 160;
  }

  if (runtime.intent === "time" && /审批时限|预审期限|审查期限|工作日/.test(text)) score += 50;
  if (runtime.intent === "materials" && /所需材料|申请表|证明|上传至系统/.test(text)) score += 40;
  if (runtime.intent === "windows" && chunk.tags.includes("windows")) score += 120;
  if (runtime.fallbackMode && hasAnyTag(chunk, ["employer", "longTerm", "shortTerm", "extension", "change", "cancellation", "windows"])) {
    score += 35;
  }

  const tokens = extractQueryTokens(runtime.semanticQuestion);
  for (const token of tokens) {
    if (text.includes(token)) {
      score += 8;
      matchedTokenCount += 1;
    }
  }

  const faqHighMatch = isHighConfidenceFaqMatch(chunk, runtime.semanticQuestion);
  return { score, matchedTokenCount, faqHighMatch };
}

export function selectEvidence(referenceIndex, runtime) {
  const scored = referenceIndex.chunks
    .map((chunk) => {
      const scoredChunk = scoreChunk(chunk, runtime);
      return {
        ...chunk,
        score: scoredChunk.score,
        matchedTokenCount: scoredChunk.matchedTokenCount,
        faqHighMatch: scoredChunk.faqHighMatch,
      };
    })
    .filter((chunk) => {
      if (chunk.score <= 0) return false;
      const hasBusinessTagMatch = hasAnyTag(chunk, businessTags(runtime.slots));
      return chunk.faqHighMatch || chunk.matchedTokenCount > 0 || hasBusinessTagMatch;
    })
    .sort((a, b) => b.score - a.score);

  const maxChunks = runtime.isAClassDefinition ? 2 : runtime.fallbackMode ? 10 : 6;
  const selected = [];

  // 对 FAQ 问题优先纳入高匹配 FAQ 条目，避免遗漏“小贴士”中的关键口径。
  const faqPriority = scored.filter((chunk) => isHighConfidenceFaqMatch(chunk, runtime.semanticQuestion));
  for (const chunk of faqPriority) {
    if (selected.some((item) => item.title === chunk.title)) continue;
    selected.push(chunk);
    if (selected.length >= maxChunks) break;
  }

  for (const chunk of scored) {
    if (selected.some((item) => item.title === chunk.title)) continue;
    selected.push(chunk);
    if (selected.length >= maxChunks) break;
  }

  return selected
    .map((chunk, index) => `【材料 ${index + 1}｜${chunk.title}｜${chunk.tags.join(",")}】\n${chunk.content}`)
    .join("\n\n---\n\n");
}
