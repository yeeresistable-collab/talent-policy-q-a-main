import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { TopicId } from "@/data/faq";

interface ChatDialogContextValue {
  open: boolean;
  topic: TopicId;
  initialQuestion: string | null;
  openDialog: (topic?: TopicId, initialQuestion?: string) => void;
  closeDialog: () => void;
  setTopic: (topic: TopicId) => void;
  consumeInitialQuestion: () => string | null;
}

const ChatDialogContext = createContext<ChatDialogContextValue | undefined>(undefined);

export function ChatDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<TopicId>("all");
  const [initialQuestion, setInitialQuestion] = useState<string | null>(null);

  const openDialog = useCallback((nextTopic?: TopicId, question?: string) => {
    if (nextTopic) setTopic(nextTopic);
    if (question) setInitialQuestion(question);
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => setOpen(false), []);

  const consumeInitialQuestion = useCallback(() => {
    const q = initialQuestion;
    setInitialQuestion(null);
    return q;
  }, [initialQuestion]);

  return (
    <ChatDialogContext.Provider
      value={{ open, topic, initialQuestion, openDialog, closeDialog, setTopic, consumeInitialQuestion }}
    >
      {children}
    </ChatDialogContext.Provider>
  );
}

export function useChatDialog() {
  const ctx = useContext(ChatDialogContext);
  if (!ctx) throw new Error("useChatDialog must be used within ChatDialogProvider");
  return ctx;
}
