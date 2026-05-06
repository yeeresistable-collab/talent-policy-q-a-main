import { setWorkPermitKnowledge, type WorkPermitSkillConfig } from "./skill-engine/workPermitConfig.ts";
import { buildMessagesForRequest } from "./skill-engine/skillRuntime.ts";
import type { ChatMsg } from "./skill-engine/text.ts";

/** 与本地 Node 后端一致：先按参考材料构建检索 / 追问 / 拒答，再调用 Lovable 流式补全。 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const knowledgeBase = new URL("./knowledge/", import.meta.url);
const referenceText = await Deno.readTextFile(new URL("beijing-work-permit-reference.md", knowledgeBase));
const skillMd = await Deno.readTextFile(new URL("skill.md", knowledgeBase));
const skillJson = JSON.parse(await Deno.readTextFile(new URL("skill.json", knowledgeBase))) as WorkPermitSkillConfig;
setWorkPermitKnowledge(skillMd, skillJson);

function normalizeMessages(raw: unknown): ChatMsg[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((message: unknown) => {
      if (!message || typeof message !== "object") return false;
      const m = message as { role?: unknown; content?: unknown };
      return (
        ["system", "user", "assistant"].includes(String(m.role)) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
      );
    })
    .map((message: unknown) => {
      const m = message as { role: string; content: string };
      return { role: m.role, content: m.content };
    });
}

function sseSingleChunk(text: string): Response {
  const payload = JSON.stringify({
    choices: [{ delta: { content: text } }],
  });
  const body = `data: ${payload}\n\ndata: [DONE]\n\n`;
  return new Response(body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const messages = normalizeMessages(body.messages);

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages 不能为空" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY 未配置" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatPlan = buildMessagesForRequest(messages, referenceText);

    if ("directResponse" in chatPlan) {
      return sseSingleChunk(chatPlan.directResponse);
    }

    const messagesForModel = chatPlan.messages;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: messagesForModel,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "咨询人数较多，请稍后再试。" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 服务额度不足，请联系管理员充值。" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI 服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
