import { MessageSquareText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatDialog } from "@/context/ChatDialogContext";

const NAV = [
  { label: "首页", href: "#home" },
  { label: "人才政策", href: "#policies" },
  { label: "申报指南", href: "#guide" },
  { label: "政策问答", href: "#chat", highlight: true },
  { label: "联系我们", href: "#footer" },
];

export function SiteHeader() {
  const { openDialog } = useChatDialog();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <a href="#home" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gov-red text-gov-red-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">市人才服务中心</p>
            <p className="text-xs text-muted-foreground">人才政策助手</p>
          </div>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) =>
            n.highlight ? (
              <button
                key={n.label}
                onClick={() => openDialog()}
                className="rounded-md bg-gov-red/10 px-3 py-2 text-sm font-medium text-gov-red transition-colors hover:bg-gov-red/15"
              >
                {n.label}
              </button>
            ) : (
              <a
                key={n.label}
                href={n.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {n.label}
              </a>
            ),
          )}
        </nav>

        <Button
          onClick={() => openDialog()}
          className="hidden bg-gov-red text-gov-red-foreground hover:bg-gov-red/90 md:inline-flex"
        >
          <MessageSquareText className="mr-1.5 h-4 w-4" />
          政策咨询
        </Button>

        <Button
          onClick={() => openDialog()}
          size="sm"
          className="bg-gov-red text-gov-red-foreground hover:bg-gov-red/90 md:hidden"
        >
          <MessageSquareText className="mr-1 h-4 w-4" />
          咨询
        </Button>
      </div>
    </header>
  );
}
