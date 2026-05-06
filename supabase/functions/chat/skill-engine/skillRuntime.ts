import type { ChatMsg } from "./text.ts";
import { buildWorkPermitChatPlan, type ChatPlan } from "./workPermitRuntime.ts";

export function buildMessagesForRequest(messages: ChatMsg[], referenceText: string): ChatPlan {
  return buildWorkPermitChatPlan(messages, referenceText);
}
