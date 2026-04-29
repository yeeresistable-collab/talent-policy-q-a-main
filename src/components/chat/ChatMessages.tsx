import { Bot, User } from "lucide-react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/hooks/useChatStream";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  fullscreen?: boolean;
}

export function ChatMessages({ messages, isLoading, fullscreen }: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 overflow-y-auto px-4 py-4",
        fullscreen ? "text-base" : "text-sm",
      )}
    >
      {messages.map((m, idx) => (
        <div
          key={idx}
          className={cn(
            "flex gap-3",
            m.role === "user" ? "flex-row-reverse" : "flex-row",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              m.role === "user"
                ? "bg-gov-blue text-gov-blue-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
          <div
            className={cn(
              "max-w-[85%] rounded-lg px-4 py-3 shadow-sm",
              m.role === "user"
                ? "bg-gov-blue text-gov-blue-foreground"
                : "border border-border bg-card text-card-foreground",
            )}
          >
            {m.role === "assistant" ? (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:my-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-table:my-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-border bg-background/60">
                        <table className="m-0 min-w-full border-collapse text-left text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-muted/80 text-foreground">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="whitespace-nowrap border-b border-r border-border px-3 py-2 font-semibold last:border-r-0">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="min-w-24 border-b border-r border-border px-3 py-2 align-top leading-relaxed last:border-r-0">
                        {children}
                      </td>
                    ),
                    tr: ({ children }) => (
                      <tr className="last:[&>td]:border-b-0">{children}</tr>
                    ),
                  }}
                >
                  {m.content || "正在思考…"}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            )}
          </div>
        </div>
      ))}
      {isLoading && messages[messages.length - 1]?.role === "user" && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <span className="inline-flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
            </span>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
