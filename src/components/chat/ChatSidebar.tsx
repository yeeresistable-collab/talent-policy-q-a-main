import { HelpCircle, MessageSquare, Plus } from "lucide-react";
import { FAQS } from "@/data/faq";
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

// 精选 5 个最常见的问题
const ALL_FAQS: string[] = [
  FAQS.settle[0],
  FAQS.subsidy[0],
  FAQS.housing[0],
  FAQS.family[0],
  FAQS.workPermit[0],
  FAQS.workPermit[3],
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
        "flex h-full min-h-0 flex-col gap-4 overflow-y-auto border-r border-border bg-background/70 p-4 backdrop-blur-sm",
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
          常见问题
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

      <div className="min-h-0 flex-1">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> 历史对话
        </h3>
        <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
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

      <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-foreground">
        <p className="font-semibold text-foreground">人工服务</p>
        <p className="mt-1 leading-relaxed text-muted-foreground">
          12345 政务服务热线<br />
          周一至周日 8:30-17:30
        </p>
      </div>
    </aside>
  );
}
