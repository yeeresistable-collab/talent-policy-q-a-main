import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

const CHAT_URL = import.meta.env.VITE_CHAT_URL ?? "/api/chat";

export function useChatStream(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback((next: ChatMessage[] = []) => {
    abortRef.current?.abort();
    setMessages(next);
    setIsLoading(false);
  }, []);

  const send = useCallback(
    async (input: string) => {
      const text = input.trim();
      if (!text || isLoading) return;

      const userMsg: ChatMessage = { role: "user", content: text };
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setIsLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let assistantSoFar = "";
      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (publishableKey) {
          headers.Authorization = `Bearer ${publishableKey}`;
        }

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({ messages: nextHistory }),
          signal: controller.signal,
        });

        if (!resp.ok || !resp.body) {
          if (resp.status === 429) {
            toast.error("咨询人数较多，请稍后再试");
          } else if (resp.status === 402) {
            toast.error("AI 服务额度不足，请联系管理员");
          } else {
            toast.error("AI 服务暂时不可用，请稍后重试");
          }
          setMessages((prev) => prev.slice(0, -1));
          setIsLoading(false);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let done = false;

        while (!done) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line || line.startsWith(":")) continue;
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(payload);
              const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (delta) upsertAssistant(delta);
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error(e);
          toast.error("网络异常，请重试");
          setMessages((prev) => prev.slice(0, -1));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  return { messages, isLoading, send, reset, setMessages };
}
