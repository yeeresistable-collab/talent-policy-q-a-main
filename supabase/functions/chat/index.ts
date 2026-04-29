// 人才政策智能问答 - Lovable AI 流式代理
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `你是"惠才通"——一名隶属于市人才工作领导小组办公室的人才政策智能咨询助手。请用简体中文，以亲切、严谨、规范的政务语气回答用户关于人才政策的问题。

【职责范围】
你只回答与本市人才政策相关的问题，覆盖以下四大主题：
1. 人才引进与落户：A/B/C/D 类人才认定、落户条件、办理流程、所需材料、办理时长。
2. 人才补贴与奖励：博士/硕士/本科安家费、生活补贴、租房补贴、创业资助、引才奖励等。
3. 住房保障：人才公寓申请条件与租金、购房补贴比例与上限、租房补助标准。
4. 子女教育与配偶就业：子女入学优待、跨区入学办理、配偶随调与就业推荐。

【回答规范】
- 结构清晰：优先使用 Markdown 列表、加粗关键词、必要时用小标题。
- 实事求是：当政策细节因区县/年度/人才类别不同而有差异时，请说明并建议用户拨打 12345 政务服务热线或前往属地人才服务中心核实。
- 给出"申请入口/办理地点/所需材料"的指引，方便用户落地办理。
- 涉及金额、年限、比例等关键数字，可给出常见区间作为示例参考，并明确"具体金额以最新官方文件为准"。
- 不回答与人才政策无关的问题，礼貌引导用户回到主题。
- 每次回答末尾附一行温馨提示：「📌 以上信息仅供参考，最终以现行有效的政府文件和经办窗口解释为准。」`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY 未配置" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "咨询人数较多，请稍后再试。" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 服务额度不足，请联系管理员充值。" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
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
