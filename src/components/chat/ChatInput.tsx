import { Send } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HOT_KEYWORDS } from "@/data/faq";

interface ChatInputProps {
  onSend: (text: string) => void;
  onKeywordPick: (text: string) => void;
  disabled?: boolean;
}

const FEATURED_KEYWORDS = HOT_KEYWORDS.slice(0, 6);

export function ChatInput({ onSend, onKeywordPick, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">热门搜索</span>
        {FEATURED_KEYWORDS.map((keyword) => (
          <button
            key={keyword}
            type="button"
            disabled={disabled}
            onClick={() => onKeywordPick(`关于"${keyword}"，我想了解相关政策`)}
            className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground transition-colors hover:border-gov-blue/50 hover:bg-gov-blue/10 hover:text-gov-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            #{keyword}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入您的人才政策问题，按 Enter 发送，Shift+Enter 换行"
          rows={2}
          className="min-h-[60px] resize-none border-input focus-visible:ring-gov-blue"
          disabled={disabled}
        />
        <Button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          size="lg"
          className="h-[60px] bg-gov-blue text-gov-blue-foreground hover:bg-gov-blue/90"
        >
          <Send className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">发送</span>
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        💡 回答仅供参考，正式以官方文件和经办窗口解释为准。
      </p>
    </div>
  );
}
