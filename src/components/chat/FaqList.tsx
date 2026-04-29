import { HelpCircle } from "lucide-react";
import { getFaqsForTopic, type TopicId } from "@/data/faq";

interface FaqListProps {
  topic: TopicId;
  onPick: (q: string) => void;
  disabled?: boolean;
}

export function FaqList({ topic, onPick, disabled }: FaqListProps) {
  const faqs = getFaqsForTopic(topic);
  return (
    <div className="px-4 pb-3 pt-1">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <HelpCircle className="h-3.5 w-3.5" />
        常见问题（点击直接提问）
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {faqs.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onPick(q)}
            className="group rounded-md border border-border bg-card px-3 py-2 text-left text-xs text-card-foreground transition-colors hover:border-gov-red hover:bg-gov-red/5 hover:text-gov-red disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="mr-1.5 inline-block h-1 w-1 rounded-full bg-gov-red align-middle" />
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
