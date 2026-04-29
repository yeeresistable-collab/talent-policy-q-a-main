import { MessageSquareText } from "lucide-react";
import { useChatDialog } from "@/context/ChatDialogContext";

export function FloatingChatButton() {
  const { openDialog, open } = useChatDialog();
  if (open) return null;

  return (
    <button
      type="button"
      onClick={() => openDialog()}
      aria-label="打开人才政策智能问答"
      className="group fixed bottom-6 right-6 z-40 flex items-center gap-2"
    >
      <span className="hidden rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-md transition-all group-hover:flex sm:inline-block">
        政策有问题？点我咨询
      </span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gov-red text-gov-red-foreground shadow-lg shadow-gov-red/40 transition-transform hover:scale-105">
        <span className="absolute inset-0 animate-ping rounded-full bg-gov-red/40" />
        <MessageSquareText className="relative h-6 w-6" />
      </span>
    </button>
  );
}
