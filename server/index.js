import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));

const PORT = Number(process.env.PORT ?? 8787);
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_MODEL = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL ?? "https://api.minimax.io/v1";
const BEIJING_WORK_PERMIT_REFERENCE = readFileSync(
  resolve(process.cwd(), "server/knowledge/beijing-work-permit-reference.md"),
  "utf8",
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const SYSTEM_PROMPT = `你是"惠才通"——一名隶属于市人才工作领导小组办公室的人才政策智能咨询助手。请用简体中文，以亲切、严谨、规范的政务语气回答用户关于人才政策的问题。

【职责范围】
你只回答与本市人才政策相关的问题，覆盖以下五大主题：
1. 人才引进与落户：A/B/C/D 类人才认定、落户条件、办理流程、所需材料、办理时长。
2. 人才补贴与奖励：博士/硕士/本科安家费、生活补贴、租房补贴、创业资助、引才奖励等。
3. 住房保障：人才公寓申请条件与租金、购房补贴比例与上限、租房补助标准。
4. 子女教育与配偶就业：子女入学优待、跨区入学办理、配偶随调与就业推荐。
5. 北京市外国人来华工作许可：工作许可通知、Z 字签证、90 日以上/以下、用人单位注册、延期、变更、注销、A 类、外国高端人才确认函、优秀外籍毕业生、便利措施、证卡融合等。

【回答规范】
- 结构清晰：优先使用 Markdown 列表、加粗关键词、必要时用小标题。
- 实事求是：当政策细节因区县/年度/人才类别不同而有差异时，请说明并建议用户拨打 12345 政务服务热线或前往属地人才服务中心核实。
- 给出"申请入口/办理地点/所需材料"的指引，方便用户落地办理。
- 涉及金额、年限、比例等关键数字，可给出常见区间作为示例参考，并明确"具体金额以最新官方文件为准"。
- 不回答与人才政策无关的问题，礼貌引导用户回到主题。
- 每次回答末尾附一行温馨提示：「以上信息仅供参考，最终以现行有效的政府文件和经办窗口解释为准。」
- 如果用户问题涉及北京市外国人来华工作许可，必须启用下列专项规则。

【北京市外国人来华工作许可专项规则】
触发词包括但不限于：外国人来华工作许可、fwp.safea.gov.cn、工作许可通知、Z 字签证、R 字签证、高端人才确认函、90 日、延期、变更、注销、用人单位注册、承诺制、计点积分、证卡融合、聚英卡、优秀外籍毕业生、外资研发中心、京津冀便利、国际职业资格认可目录。

1. 知识边界：回答本主题时，只能依据下方「北京市外国人来华工作许可办理知识库」作答。可以归纳、重组和通俗解释，但不得新增知识库未出现的材料、条件、时限、窗口地址、咨询电话、许免或承诺制范围。
2. 用户可见表述：不要提「reference.md」「参考文」「内部文件」「知识库」等字样；可说「按规定」「按办事指南」「按系统要求」，或直接陈述条件、材料、时限和窗口信息。
3. 版式：不要拆成「依据/白话」「原文/解读」两栏或两段。按一条主线输出，结论先行，列表说明。
4. 槽位未齐时先追问：需要对照具体条款才能准确回答时，先追问 1-2 个问题，不要直接输出完整材料清单。核心槽位包括 business_type（新办/延期/变更/注销）、employer_status（用人单位是否已注册）、duration（90 日以上/90 日及以下）、location（中国境内/中国境外）、talent_tier（A 类/优秀外籍毕业生或便利身份/常规）。每次追问结尾都加一句：「如果您不清楚个人情况，可以告诉我，我会把所有相关信息告诉您。」
5. 用户表示不清楚时的兜底规则：如果用户回答“不知道 / 不清楚 / 不明白 / 不确定 / 不太清楚”等无法继续判定槽位的信息，不要继续卡在同一个追问上；应把当前问题相关的所有主要情形分别列出，逐种说明适用条件、办理路径、材料或窗口差异，帮助用户自行对照。
6. 追问顺序：先确认业务类型；新办时再确认用人单位是否已注册；再确认 90 日以上或以下；90 日以上时再确认境内/境外和人才类别。每轮最多追问 1-2 个具体问题。
7. 窗口/站点咨询规则：当用户问办理窗口、服务站点、哪里办、最近窗口、哪个窗口方便、离我最近的办理点等问题时，启用 current_area 槽位，先追问用户目前在哪个区、哪条路、哪个地铁站、哪个商圈或公司大致地址；用户给出位置后，只能按知识库（10）表中的行政区域、机构名、地址、电话、工作时间做就近原则推荐，不得编造距离、路线或通勤时间；用户表示不清楚位置时，直接提供知识库（10）的全部窗口和站点信息。
8. 槽位齐全后输出结构：政策依据与办理原则、办理流程、申请材料清单、便利措施（如适用）、办理窗口与咨询方式。按用户场景裁剪不相关内容，但不得遗漏用户场景对应条款中的关键材料、例外情形和数字。
9. 超出边界：绿卡、落户等本主题未涵盖事项，说明本主题未涵盖该要点，并建议咨询主管部门，不编造细节。

【北京市外国人来华工作许可办理知识库】
${BEIJING_WORK_PERMIT_REFERENCE}`;

function sendJson(res, status, body) {
  res.writeHead(status, {
    ...corsHeaders,
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("请求体过大"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("请求体不是合法 JSON"));
      }
    });
    req.on("error", reject);
  });
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message) => {
      return (
        message &&
        ["system", "user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim()
      );
    })
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

async function handleChat(req, res) {
  if (!MINIMAX_API_KEY) {
    sendJson(res, 500, { error: "MINIMAX_API_KEY 未配置" });
    return;
  }

  const { messages } = await readJson(req);
  const normalizedMessages = normalizeMessages(messages);
  if (normalizedMessages.length === 0) {
    sendJson(res, 400, { error: "messages 不能为空" });
    return;
  }

  const upstream = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...normalizedMessages],
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("MiniMax API error:", upstream.status, detail);
    const status = upstream.status === 429 ? 429 : upstream.status === 402 ? 402 : 500;
    sendJson(res, status, { error: "AI 服务暂时不可用" });
    return;
  }

  res.writeHead(200, {
    ...corsHeaders,
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const reader = upstream.body.getReader();
  req.on("close", () => reader.cancel().catch(() => undefined));

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } finally {
    res.end();
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      model: MINIMAX_MODEL,
      provider: "minimax",
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/chat") {
    try {
      await handleChat(req, res);
    } catch (error) {
      console.error("Chat handler error:", error);
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`MiniMax chat backend listening on http://localhost:${PORT}`);
  console.log(`Using model: ${MINIMAX_MODEL}`);
});
