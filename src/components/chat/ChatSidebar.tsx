import { HelpCircle, MessageSquare, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatHistoryItem {
  id: string;
  title: string;
  updatedAt: number;
}

interface ChatSidebarProps {
  onQuestionPick: (q: string) => void;
  onNewConversation: () => void;
  onConversationPick: (id: string) => void;
  conversations: ChatHistoryItem[];
  activeConversationId: string;
  fullscreen?: boolean;
  disabled?: boolean;
}

// 与首页保持一致的热门问题
const ALL_FAQS: string[] = [
  "境外获得的学位证书是否需要认证，在哪里认证？",
  "无犯罪记录证明如何开具？",
  "是否一定要做境外体检？",
  "随行家属关系证明需要认证吗？",
  "哪些材料需要翻译？",
];

export function ChatSidebar({
  onQuestionPick,
  onNewConversation,
  onConversationPick,
  conversations,
  activeConversationId,
  fullscreen,
  disabled,
}: ChatSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col gap-4 overflow-hidden border-r border-border bg-background/70 p-4 backdrop-blur-sm",
        fullscreen ? "w-80" : "w-64",
      )}
    >
      <div>
        <button
          type="button"
          disabled={disabled}
          onClick={onNewConversation}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gov-blue/25 bg-gov-blue px-3 py-2.5 text-sm font-semibold text-gov-blue-foreground shadow-sm transition-colors hover:bg-gov-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          新建对话
        </button>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5" />
          热门问题
        </h3>
        <nav className="flex flex-col gap-1.5">
          {ALL_FAQS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={disabled}
              onClick={() => onQuestionPick(q)}
              className="group rounded-md border border-border bg-background px-3 py-2 text-left text-xs leading-relaxed text-foreground transition-colors hover:border-gov-blue/50 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="mr-1.5 inline-block h-1 w-1 rounded-full bg-muted-foreground align-middle" />
              {q}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> 历史对话
        </h3>
        <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-y-auto pr-1">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              disabled={disabled}
              onClick={() => onConversationPick(conversation.id)}
              className={cn(
                "rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                conversation.id === activeConversationId
                  ? "border-gov-blue/40 bg-gov-blue/10 text-gov-blue"
                  : "border-border bg-background text-foreground hover:border-gov-blue/50 hover:bg-accent",
              )}
            >
              <span className="block truncate text-xs font-medium">{conversation.title}</span>
              <span className="mt-1 block text-[10px] text-muted-foreground">
                {new Date(conversation.updatedAt).toLocaleString("zh-CN", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 rounded-md border border-border bg-muted/40 p-3 text-xs text-foreground">
        <p className="font-semibold text-foreground">咨询提示</p>
        <p className="mt-1 leading-relaxed text-muted-foreground">
          如遇复杂个案，请以属地经办窗口或官方办事渠道解释为准。
        </p>
      </div>
    </aside>
  );
}
