import { buildWorkPermitChatPlan } from "./skill-engine/workPermitRuntime.js";

export function buildMessagesForRequest(messages, referenceText) {
  return buildWorkPermitChatPlan(messages, referenceText);
}
