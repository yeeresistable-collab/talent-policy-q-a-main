export function normalizeText(text: unknown) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function applyAliases(text: unknown, aliases: { from: string; to: string }[] = []) {
  let normalized = normalizeText(text);
  for (const alias of aliases) {
    if (!alias?.from || !alias?.to) continue;
    normalized = normalized.replace(new RegExp(escapeRegExp(alias.from), "gi"), alias.to);
  }
  return normalizeText(normalized);
}

export interface ChatMsg {
  role: string;
  content: string;
}

export function getLastMessage(messages: ChatMsg[], role: string) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === role) return messages[i].content;
  }
  return "";
}

export function getUserMessages(messages: ChatMsg[]) {
  return messages.filter((message) => message.role === "user").map((message) => message.content);
}

export function getPreviousUserMessage(messages: ChatMsg[]) {
  let seenLatest = false;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role !== "user") continue;
    if (!seenLatest) {
      seenLatest = true;
      continue;
    }
    return messages[i].content;
  }
  return "";
}
