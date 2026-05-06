import { buildReferenceIndex } from "./referenceIndex.js";
import { selectEvidence } from "./evidence.js";
import { getLastMessage, getPreviousUserMessage, getUserMessages, normalizeText } from "./text.js";
import { APP_SKILL_PROMPT, BASE_POLICY_PROMPT } from "./workPermitConfig.js";
import {
  classifyIntent,
  detectPendingSlot,
  inferAreaFromText,
  inferSlots,
  isAClassDefinition,
  isUnclearReply,
  normalizeSkillText,
  normalizeSlotsForIntent,
  wantsGenericExplanation,
} from "./workPermitNlu.js";
import {
  buildMandatoryFollowUp,
  buildShortTermDirectResponse,
  buildWindowDirectResponse,
} from "./workPermitTools.js";

function normalizeForMatch(text) {
  return String(text ?? "").replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, "").toLowerCase();
}

function hasHighConfidenceFaqMatch(referenceIndex, semanticQuestion) {
  const normalizedQuestion = normalizeForMatch(semanticQuestion);
  if (!normalizedQuestion) return false;
  return referenceIndex.chunks.some((chunk) => {
    if (!chunk.tags.includes("faq")) return false;
    const normalizedTitle = normalizeForMatch(chunk.title);
    return (
      normalizedTitle.includes(normalizedQuestion) ||
      normalizedQuestion.includes(normalizedTitle)
    );
  });
}

export function buildWorkPermitChatPlan(messages, referenceText) {
  const referenceIndex = buildReferenceIndex(referenceText);
  const latestUserMessage = getLastMessage(messages, "user");
  const previousUserMessage = getPreviousUserMessage(messages);
  const lastAssistantMessage = getLastMessage(messages, "assistant");
  const userText = normalizeSkillText(getUserMessages(messages).join(" "));
  const pendingSlot = detectPendingSlot(lastAssistantMessage);
  const faqGateMatch = hasHighConfidenceFaqMatch(referenceIndex, normalizeSkillText(latestUserMessage));

  const fallbackMode = isUnclearReply(latestUserMessage) && Boolean(pendingSlot);
  const isCurrentAreaFollowUp = pendingSlot === "current_area";
  const isSlotFollowUp = Boolean(pendingSlot) && !fallbackMode;
  const semanticQuestion = normalizeSkillText(
    isSlotFollowUp
      ? `${previousUserMessage} ${latestUserMessage}`
      : fallbackMode && previousUserMessage
        ? previousUserMessage
        : latestUserMessage,
  );
  const intent = isCurrentAreaFollowUp ? "windows" : classifyIntent(semanticQuestion);
  const slots = normalizeSlotsForIntent(inferSlots(messages), intent);
  if (intent === "windows" && !isCurrentAreaFollowUp) {
    // 窗口咨询优先使用“当前问题”中的位置，不沿用旧会话位置，避免误命中固定区县。
    slots.current_area = inferAreaFromText(semanticQuestion);
  }
  const runtime = {
    intent,
    slots,
    pendingSlot,
    fallbackMode,
    semanticQuestion,
    isAClassDefinition: isAClassDefinition(semanticQuestion),
  };

  const hasFaqMatch = hasHighConfidenceFaqMatch(referenceIndex, semanticQuestion);

  const mandatoryFollowUp = fallbackMode || wantsGenericExplanation(latestUserMessage) || hasFaqMatch
    ? undefined
    : buildMandatoryFollowUp(intent, slots, latestUserMessage);

  if (mandatoryFollowUp) {
    return {
      directResponse: `需要先确认具体情况，以免给错口径。\n\n${mandatoryFollowUp.question}\n\n如果您不清楚个人情况，可以告诉我，我会把所有相关信息告诉您。`,
    };
  }

  const shortTermDirectResponse = buildShortTermDirectResponse(referenceIndex, runtime);
  if (shortTermDirectResponse) {
    return { directResponse: shortTermDirectResponse };
  }

  const windowDirectResponse = buildWindowDirectResponse(referenceIndex, runtime);
  if (windowDirectResponse) {
    return { directResponse: windowDirectResponse };
  }

  const evidence = selectEvidence(referenceIndex, runtime);
  if (!evidence.trim()) {
    return {
      directResponse:
        "现有办事指南未检索到与您问题直接对应的内容，当前无法给出办理口径。建议您补充更具体的业务场景（如新办/延期/变更/注销、90日以上或以下、境内或境外）后我再按材料精确回答。\n\n以上信息仅供参考，最终以现行有效的政府文件和经办窗口解释为准。",
    };
  }
  const systemPrompt = `${BASE_POLICY_PROMPT}

【应用内 Skill 定义】
${APP_SKILL_PROMPT}

【Skill Runner 决策】
- 已触发 skill：beijing-work-permit-consultant
- 用户语义目标：${runtime.intent}
- 当前槽位：${JSON.stringify(runtime.slots)}
- 上轮待补槽位：${runtime.pendingSlot ?? "无"}
- 是否进入“不清楚”兜底：${runtime.fallbackMode ? "是" : "否"}
- 是否泛问 A 类定义：${runtime.isAClassDefinition ? "是" : "否"}

【执行要求】
1. 只能依据“本轮可用材料”回答；不得使用外部知识、常识、联网信息或模型记忆。
2. 如果进入“不清楚”兜底，不要继续追问同一槽位，应按本轮材料列出主要情形供用户对照。
3. 回答事实必须与材料标签匹配：定义只用 definition/condition，材料只用 materials，流程只用 process，时限只用 time，窗口只用 windows；当 FAQ 标题与用户问题高度匹配时，可引用 faq/tips 标签材料作为同等依据。
4. 如果本轮材料不能完整回答，明确说明“现有办事指南未完整列明该要点”，不要用相邻章节补齐。
5. 不要提“材料标签”“Skill Runner”“内部文件”等实现词。
6. 输出前自检并删除关键词相关但语义不匹配的内容。
7. 结论必须可在“本轮可用材料”中找到对应依据；不得补充材料外的数字、条件、流程或口径。若材料未写明，直接说明“现有办事指南未完整列明该要点”。

【本轮可用材料】
${evidence}`;

  return { messages: [{ role: "system", content: systemPrompt }, ...messages] };
}
