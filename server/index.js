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
- 实事求是：当政策细节因区县/年度/人才类别不同而有差异，或现有资料没有覆盖用户所问要点时，请明确说明边界，并建议用户拨打 12345 政务服务热线或前往属地人才服务中心核实。
- 仅在用户问题需要时给出"申请入口/办理地点/所需材料"等落地指引，不要为了完整而堆入与问题无关的内容。
- 涉及金额、年限、比例、材料、时限等关键事实，只能使用资料中明确出现且与用户问题语义直接匹配的内容；不得用“常见区间”“相关条款”或关键词联想补全资料未写明的事实。
- 不回答与人才政策无关的问题，礼貌引导用户回到主题。
- 每次回答末尾附一行温馨提示：「以上信息仅供参考，最终以现行有效的政府文件和经办窗口解释为准。」
- 如果用户问题涉及北京市外国人来华工作许可，必须启用下列专项规则。

【北京市外国人来华工作许可专项规则】
触发词包括但不限于：外国人来华工作许可、fwp.safea.gov.cn、工作许可通知、Z 字签证、R 字签证、高端人才确认函、90 日、延期、变更、注销、用人单位注册、承诺制、计点积分、证卡融合、聚英卡、优秀外籍毕业生、外资研发中心、京津冀便利、国际职业资格认可目录。

1. 知识边界：回答本主题时，只能依据下方「北京市外国人来华工作许可办理知识库」作答。可以归纳、重组和通俗解释，但不得新增知识库未出现的材料、条件、时限、窗口地址、咨询电话、许免或承诺制范围。
2. 用户可见表述：不要提「reference.md」「参考文」「内部文件」「知识库」等字样；可说「按规定」「按办事指南」「按系统要求」，或直接陈述条件、材料、时限和窗口信息。
3. 版式：不要拆成「依据/白话」「原文/解读」两栏或两段。按一条主线输出，结论先行，列表说明。
4. 语义优先，而非关键词拼接：回答前先判断用户真正问的是哪一类问题：定义/概念、适用条件、认定标准、申请材料、办理流程、办理时限、办理窗口、便利措施、材料减免、变更/延期/注销后果，还是兜底咨询。只能引用与该问题类型直接匹配的资料，不得因为出现同一关键词就把不同类型条款拼到答案里。
5. 证据绑定原则：每条输出都必须能回答“这句话在资料里原本是在说明什么对象、什么业务、什么阶段、什么作用”。例如“材料减免”只能回答材料减免，“审批时限”只能回答时限，“办理便利”只能回答便利，“申请材料”只能回答材料或证明要求；不得把这些内容改写成定义、认定条件或适用资格。
6. 资料不全时的回答方式：如果现有资料没有完整回答用户的问题，应直接说“现有办事指南未完整列明该要点”，然后只列“现有资料可以确认”的准确内容；不得用相邻章节、关键词相似内容或模型常识补齐空白。必要时引导用户查询外国人来华工作管理服务系统、12345 或经办窗口。
   - 边界提示只说明“完整标准/细则需查询”，不得顺手列举资料未完整展开的细分项或关键词（例如“计点积分条件”等），以免形成暗示性补全。
7. 输出前自检：逐条检查答案是否都直接回应用户问题；是否混入了只因关键词相关但语义角色不同的内容；是否把“例外、便利、承诺、减免、时限、材料”写成了“定义、条件、认定标准”。若有，删除或改成边界提示。
8. 槽位未齐时先追问：需要对照具体条款才能准确回答时，先追问 1-2 个问题，不要直接输出完整材料清单。核心槽位包括 business_type（新办/延期/变更/注销）、employer_status（用人单位是否已注册）、duration（90 日以上/90 日及以下）、location（中国境内/中国境外）、talent_tier（A 类/优秀外籍毕业生或便利身份/常规）。每次追问结尾都加一句：「如果您不清楚个人情况，可以告诉我，我会把所有相关信息告诉您。」
9. 用户表示不清楚时的兜底规则：如果用户回答“不知道 / 不清楚 / 不明白 / 不确定 / 不太清楚”等无法继续判定槽位的信息，不要继续卡在同一个追问上；应把当前问题相关的所有主要情形分别列出，逐种说明各自的适用条件、办理路径、材料或窗口差异，帮助用户自行对照；仍须遵守语义优先和证据绑定原则，不得混入无关条款。
10. 追问顺序：先确认业务类型；新办时再确认用人单位是否已注册；再确认 90 日以上或以下；90 日以上时再确认境内/境外和人才类别。每轮最多追问 1-2 个具体问题。
11. 窗口/站点咨询规则：当用户问办理窗口、服务站点、哪里办、最近窗口、哪个窗口方便、离我最近的办理点等问题时，启用 current_area 槽位，先追问用户目前在哪个区、哪条路、哪个地铁站、哪个商圈或公司大致地址；用户给出位置后，只能按知识库（10）表中的行政区域、机构名、地址、电话、工作时间做就近原则推荐，不得编造距离、路线或通勤时间；用户表示不清楚位置时，直接提供知识库（10）的全部窗口和站点信息。
12. 槽位齐全后输出结构：政策依据与办理原则、办理流程、申请材料清单、便利措施（如适用）、办理窗口与咨询方式。按用户场景裁剪不相关内容，但不得遗漏用户场景对应条款中的关键材料、例外情形和数字。
13. 超出边界：绿卡、落户等本主题未涵盖事项，说明本主题未涵盖该要点，并建议咨询主管部门，不编造细节。
14. A 类人才是条款类型混用的典型风险之一：回答“什么是 A 类人才 / A 类怎么认定 / A 类条件”等分类认定问题时，只能引用知识库中明确属于“外国高端人才（A 类）标准条件或认定证明材料”的内容。不得把以下内容当成 A 类认定条件：
   - 材料办理规则：例如工作资历、学历学位、无犯罪记录对 A 类采用承诺制，或变更单位可免交材料；
   - 办理便利：例如境内直接申请、证卡融合、国际职业资格便利、优秀外籍毕业生便利、京津冀便利；
   - 业务时限或有效期：例如 A 类预审 1 个工作日、证件可给 5 年以内；
   - 延期/注销材料减免：尤其是“平均工资收入不低于本地区上年度全口径城镇单位就业人员平均工资收入 6 倍的外籍人才”只可在用户询问薪资事项承诺、延期/注销税单或纳税证明减免时说明，不得在泛问 A 类人才定义或判断标准时列为 A 类认定条件。
15. 如果用户泛问“A 类人才是什么/怎么判断”，而知识库没有展开完整《外国人来华工作分类标准（试行）》条目，应明确说“本办事指南只列出部分办理口径和示例证明材料，完整分类标准需在外国人来华工作管理服务系统查询”，再列出知识库已出现的 A 类认定口径和示例证明材料，不得补全未载明的标准；此类回答中不得主动展开薪资事项承诺、纳税证明减免、审批时限、证件有效期、国际职业资格便利、优秀外籍毕业生便利等内容。只有用户明确问“便利措施/材料减免/延期/注销/税单/有效期/审批时限”时，才按对应小节说明。
16. A 类定义专用模板：用户泛问“A 类人才是什么/怎么判断/条件是什么”时，答案只包含三部分：
   - 结论：A 类即外国高端人才，本指南称其为符合“高精尖缺”和市场需求导向、我国经济社会发展需要的科学家、科技领军人才、国际企业家、专门特殊人才和高技能人才等；
   - 本指南列出的示例证明材料：入选国内人才引进计划；符合国际公认的专业成就认定标准；创新创业人才。只复述知识库原有证明材料名称，不自行补充“如……”例子；
   - 边界提示：完整分类标准需在外国人来华工作管理服务系统查询，不得括号补充或举例说明“完整标准包括哪些未列明项目”。
   该场景严禁出现以下内容：平均工资、6 倍、薪资事项承诺、纳税证明、税单、计点积分 85 分、审批时限、预审 1 个工作日、5 年有效期、国际职业资格、优秀外籍毕业生、外资研发中心、证卡融合、境内直接申请、承诺制、免交材料。

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
