import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatDialog } from "@/context/ChatDialogContext";

export function HeroSection() {
  const { openDialog } = useChatDialog();
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-gov-red via-gov-red/95 to-gov-blue text-gov-red-foreground"
    >
      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] [background-size:24px_24px]" />
      <div className="container relative grid gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div className="flex flex-col justify-center">
          <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-gov-gold/50 bg-gov-gold/15 px-3 py-1 text-xs font-medium text-gov-gold">
            <Sparkles className="h-3.5 w-3.5" />
            AI 政策助手 · 7×24 在线
          </span>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            汇聚天下英才<br />共建美好家园
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-gov-red-foreground/90 md:text-lg">
            一站式查询人才引进、落户安居、补贴申报、子女教育等政策。智能问答 + 常见问题，让您办事少跑路、政策一问就懂。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => openDialog()}
              className="bg-gov-gold text-gov-red shadow-lg shadow-black/10 hover:bg-gov-gold/90"
            >
              立即咨询人才政策
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white"
            >
              <a href="#policies">查看四大政策方向</a>
            </Button>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-6 text-left">
            <div>
              <dt className="text-xs text-gov-red-foreground/70">累计引进人才</dt>
              <dd className="mt-1 text-2xl font-bold text-gov-gold">12.6 万+</dd>
            </div>
            <div>
              <dt className="text-xs text-gov-red-foreground/70">政策资金兑付</dt>
              <dd className="mt-1 text-2xl font-bold text-gov-gold">38.5 亿</dd>
            </div>
            <div>
              <dt className="text-xs text-gov-red-foreground/70">服务用人单位</dt>
              <dd className="mt-1 text-2xl font-bold text-gov-gold">5,200+</dd>
            </div>
          </dl>
        </div>

        <div className="hidden md:flex md:items-center md:justify-center">
          <div className="relative w-full max-w-sm rounded-xl border border-white/20 bg-white/5 p-5 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2 border-b border-white/15 pb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-gov-gold" />
              <p className="text-sm font-medium">人才政策助手</p>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-xs text-gov-red-foreground/70">访客</p>
                <p>博士引进的安家费有多少？</p>
              </div>
              <div className="rounded-lg bg-gov-gold/15 p-3 text-gov-red-foreground">
                <p className="text-xs text-gov-gold">人才政策助手</p>
                <p className="leading-relaxed">
                  根据 A 类人才认定，博士引进通常可享受 <b className="text-gov-gold">30–80 万元</b> 安家费，
                  分 3 年发放，并配套人才公寓申请资格…
                </p>
              </div>
              <button
                onClick={() => openDialog()}
                className="flex w-full items-center justify-between rounded-lg border border-white/20 px-3 py-2 text-xs text-white transition-colors hover:bg-white/10"
              >
                <span>继续对话 →</span>
                <span className="text-gov-gold">点击展开</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
