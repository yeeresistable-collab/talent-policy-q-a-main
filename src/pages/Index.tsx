import { ArrowUp, History, MapPin, Sparkles } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { ChatDialogProvider, useChatDialog } from "@/context/ChatDialogContext";
import { PolicyChatDialog } from "@/components/PolicyChatDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import hallBg from "@/assets/hall-bg.jpg";

const HOT_QUESTIONS = [
  "境外获得的学位证书是否需要认证，在哪里认证？",
  "无犯罪记录证明如何开具？",
  "是否一定要做境外体检？",
  "随行家属关系证明需要认证吗？",
  "哪些材料需要翻译？",
];

function HomeScreen() {
  const { openDialog } = useChatDialog();
  const [value, setValue] = useState("");

  const submit = (text?: string) => {
    const q = (text ?? value).trim();
    if (!q) return;
    openDialog("all", q);
    setValue("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* 背景图 */}
      <div className="absolute inset-0">
        <img
          src={hallBg}
          alt="政务大厅背景"
          className="h-full w-full object-cover"
          width={1920}
          height={1088}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/70" />
      </div>

      {/* 顶部导航 */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gov-red text-gov-red-foreground shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-foreground">人才政策助手</p>
            <p className="text-[10px] tracking-[0.2em] text-muted-foreground">TALENT POLICY ASSISTANT</p>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-sm text-foreground/80">
          <button className="flex items-center gap-1 hover:text-gov-red">
            <MapPin className="h-4 w-4" /> 本市
          </button>
          <button className="flex items-center gap-1 hover:text-gov-red">
            <History className="h-4 w-4" /> 历史记录
          </button>
        </nav>
      </header>

      {/* 主体 */}
      <section className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-20 pt-10 sm:pt-16">
        <h1 className="text-balance text-center text-2xl font-semibold text-foreground sm:text-3xl md:text-[34px]">
          Hi~我是<span className="text-gov-red">人才政策助手</span>，为您提供"暖心办"人才政策和工作许可服务
        </h1>

        {/* 主输入框 */}
        <div className="mt-10 w-full rounded-2xl border border-white/60 bg-white/80 p-4 shadow-[0_10px_40px_-12px_hsl(var(--gov-blue)/0.25)] backdrop-blur-md">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            rows={3}
            placeholder="在此输入您想了解的内容，Shift+Enter 换行"
            className="min-h-[88px] resize-none border-0 bg-transparent p-2 text-base shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-end">
            <Button
              onClick={() => submit()}
              disabled={!value.trim()}
              size="icon"
              className="h-10 w-10 rounded-full bg-gov-blue text-gov-blue-foreground hover:bg-gov-blue/90 disabled:opacity-50"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 热门问题 */}
        <div className="mt-8 w-full">
          <p className="mb-3 text-sm font-medium text-foreground/80">热门问题</p>
          <div className="flex flex-col gap-2.5">
            {HOT_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => submit(q)}
                className="group flex items-center justify-between rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-left text-sm text-foreground shadow-sm backdrop-blur-md transition hover:border-gov-red/40 hover:bg-white hover:text-gov-red"
              >
                <span>{q}</span>
                <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-gov-red">→</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 底部 */}
      <footer className="relative z-10 border-t border-white/40 bg-white/50 px-6 py-3 text-center text-xs text-muted-foreground backdrop-blur-md">
        内容由大模型智能生成，仅供参考。
      </footer>
    </main>
  );
}

const Index = () => {
  return (
    <ChatDialogProvider>
      <HomeScreen />
      <PolicyChatDialog />
    </ChatDialogProvider>
  );
};

export default Index;
