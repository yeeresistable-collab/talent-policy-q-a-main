import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatDialog } from "@/context/ChatDialogContext";
import { TOPICS } from "@/data/faq";

export function PolicyTopicsSection() {
  const { openDialog } = useChatDialog();
  return (
    <section id="policies" className="bg-background py-16">
      <div className="container">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gov-red">
            POLICY TOPICS
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            五大方向，一站式服务人才全周期
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            点击任一主题，立即开启对应方向的 AI 政策问答
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {TOPICS.map((t) => {
            const Icon = t.icon;
            return (
              <article
                key={t.id}
                className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gov-red/40 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gov-red/10 text-gov-red transition-colors group-hover:bg-gov-red group-hover:text-gov-red-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">{t.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t.description}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => openDialog(t.id)}
                  className="mt-5 -ml-3 w-fit text-gov-red hover:bg-gov-red/10 hover:text-gov-red"
                >
                  问问 AI
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
