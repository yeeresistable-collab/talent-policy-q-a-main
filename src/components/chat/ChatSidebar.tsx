import { HelpCircle, Tag } from "lucide-react";
import { FAQS, HOT_KEYWORDS } from "@/data/faq";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  onQuestionPick: (q: string) => void;
  onKeywordPick: (k: string) => void;
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
  onKeywordPick,
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

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Tag className="h-3 w-3" /> 热门搜索
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {HOT_KEYWORDS.map((k) => (
            <button
              key={k}
              type="button"
              disabled={disabled}
              onClick={() => onKeywordPick(`关于"${k}"，我想了解相关政策`)}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:border-gov-blue/50 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              #{k}
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
