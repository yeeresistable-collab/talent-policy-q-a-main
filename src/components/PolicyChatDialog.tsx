import { Maximize2, Minimize2, RefreshCw, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { Button } from "@/components/ui/button";
import { useChatDialog } from "@/context/ChatDialogContext";
import { useChatStream, type ChatMessage } from "@/hooks/useChatStream";
import { cn } from "@/lib/utils";

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "您好，我是**人才政策助手**。\n\n您可以：\n- 在左侧 **常见问题** 列表中点击任意问题快速提问\n- 或直接在下方输入您关心的人才落户、补贴、住房、子女教育、外国人来华工作许可等问题\n\n📌 以上信息仅供参考，最终以现行有效的政府文件为准。",
};

interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

interface ChatHistoryState {
  activeConversationId: string;
  conversations: ChatConversation[];
}

const CHAT_HISTORY_KEY = "talent-policy-chat-history";
const MAX_HISTORY_COUNT = 20;

const createConversationId = () =>
  `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getConversationTitle = (messages: ChatMessage[]) => {
  const firstUserMessage = messages.find((message) => message.role === "user")?.content.trim();
  if (!firstUserMessage) return "新对话";
  return firstUserMessage.length > 24
    ? `${firstUserMessage.slice(0, 24)}...`
    : firstUserMessage;
};

const createConversation = (messages: ChatMessage[] = [WELCOME]): ChatConversation => ({
  id: createConversationId(),
  title: getConversationTitle(messages),
  messages,
  updatedAt: Date.now(),
});

const readChatHistory = (): ChatHistoryState => {
  if (typeof window === "undefined") {
    const conversation = createConversation();
    return { activeConversationId: conversation.id, conversations: [conversation] };
  }

  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatConversation[]) : [];
    const validConversations = parsed.filter(
      (conversation) =>
        conversation.id &&
        Array.isArray(conversation.messages) &&
        conversation.messages.length > 0,
    );
    if (validConversations.length > 0) {
      const sortedConversations = validConversations.sort((a, b) => b.updatedAt - a.updatedAt);
      return {
        activeConversationId: sortedConversations[0].id,
        conversations: sortedConversations.slice(0, MAX_HISTORY_COUNT),
      };
    }
  } catch {
    window.localStorage.removeItem(CHAT_HISTORY_KEY);
  }

  const conversation = createConversation();
  return { activeConversationId: conversation.id, conversations: [conversation] };
};

export function PolicyChatDialog() {
  const { open, closeDialog, consumeInitialQuestion } = useChatDialog();
  const [fullscreen, setFullscreen] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistoryState>(readChatHistory);
  const { messages, isLoading, send, reset } = useChatStream();
  const activeConversation =
    chatHistory.conversations.find(
      (conversation) => conversation.id === chatHistory.activeConversationId,
    ) ?? chatHistory.conversations[0];

  // 首次打开时插入欢迎语 + 自动发送初始问题
  useEffect(() => {
    if (open) {
      if (messages.length === 0) reset(activeConversation?.messages ?? [WELCOME]);
      const q = consumeInitialQuestion();
      if (q) {
        // 微延迟确保欢迎语已插入
        setTimeout(() => send(q), 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    window.localStorage.setItem(
      CHAT_HISTORY_KEY,
      JSON.stringify(chatHistory.conversations),
    );
  }, [chatHistory.conversations]);

  useEffect(() => {
    if (!open || messages.length === 0) return;

    setChatHistory((currentHistory) => {
      const nextConversations = currentHistory.conversations
        .map((conversation) =>
          conversation.id === currentHistory.activeConversationId
            ? {
                ...conversation,
                title: getConversationTitle(messages),
                messages,
                updatedAt: Date.now(),
              }
            : conversation,
        )
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_HISTORY_COUNT);

      return {
        ...currentHistory,
        conversations: nextConversations,
      };
    });
  }, [messages, open]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) setFullscreen(false);
        else closeDialog();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, fullscreen, closeDialog]);

  // 锁滚动
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;

  const handleNewConversation = () => {
    const conversation = createConversation();
    setChatHistory((currentHistory) => ({
      activeConversationId: conversation.id,
      conversations: [conversation, ...currentHistory.conversations].slice(0, MAX_HISTORY_COUNT),
    }));
    reset(conversation.messages);
  };

  const handleConversationPick = (conversationId: string) => {
    const conversation = chatHistory.conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    setChatHistory((currentHistory) => ({
      ...currentHistory,
      activeConversationId: conversationId,
    }));
    reset(conversation.messages);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !fullscreen) closeDialog();
      }}
    >
      <div
        className={cn(
          "relative flex flex-col overflow-hidden border border-border bg-background shadow-2xl",
          "before:pointer-events-none before:absolute before:inset-0 before:opacity-[0.35] before:[background-image:radial-gradient(hsl(var(--gov-blue)/0.08)_1px,transparent_1px)] before:[background-size:22px_22px]",
          "after:pointer-events-none after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,hsl(var(--gov-red)/0.06),transparent_55%),radial-gradient(ellipse_at_bottom_left,hsl(var(--gov-blue)/0.07),transparent_55%)]",
          fullscreen
            ? "h-full w-full rounded-none"
            : "h-[85vh] max-h-[680px] w-[92vw] max-w-[920px] rounded-xl",
        )}
      >
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between border-b border-border bg-background/80 px-5 py-3 text-foreground backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gov-red text-gov-red-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">
                人才政策助手
              </h2>
              <p className="text-xs text-muted-foreground">
                覆盖落户·补贴·住房·教育就业 · 市人才工作领导小组办公室
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="h-8 gap-1 text-foreground hover:bg-accent"
              title="新建对话"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">新对话</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFullscreen((v) => !v)}
              className="h-8 w-8 text-foreground hover:bg-accent"
              title={fullscreen ? "退出全屏" : "全屏"}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeDialog}
              className="h-8 w-8 text-foreground hover:bg-accent"
              title="关闭"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Body */}
        <div className="relative z-10 flex flex-1 overflow-hidden">
          <div className="hidden md:block">
            <ChatSidebar
              onQuestionPick={(q) => send(q)}
              onNewConversation={handleNewConversation}
              onConversationPick={handleConversationPick}
              conversations={chatHistory.conversations}
              activeConversationId={chatHistory.activeConversationId}
              fullscreen={fullscreen}
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <ChatMessages messages={messages} isLoading={isLoading} fullscreen={fullscreen} />
            </div>

            <ChatInput onSend={send} onKeywordPick={(k) => send(k)} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
