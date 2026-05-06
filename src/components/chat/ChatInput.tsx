import { Send } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
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
