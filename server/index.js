import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as OpenCC from "opencc-js";
import { buildMessagesForRequest } from "./skillRuntime.js";

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
const toSimplifiedChinese = OpenCC.Converter({ from: "tw", to: "cn" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    ...corsHeaders,
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(body));
}

function sendSseText(res, text) {
  res.writeHead(200, {
    ...corsHeaders,
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: toSimplifiedChinese(text) } }] })}\n\n`);
  res.write("data: [DONE]\n\n");
  res.end();
}

function convertUpstreamSseLine(line) {
  if (!line.startsWith("data: ")) return line;

  const payload = line.slice(6).trim();
  if (!payload || payload === "[DONE]") return line;

  try {
    const parsed = JSON.parse(payload);
    for (const choice of parsed.choices ?? []) {
      if (typeof choice.delta?.content === "string") {
        choice.delta.content = toSimplifiedChinese(choice.delta.content);
      }
      if (typeof choice.message?.content === "string") {
        choice.message.content = toSimplifiedChinese(choice.message.content);
      }
    }
    return `data: ${JSON.stringify(parsed)}`;
  } catch {
    return line;
  }
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

  const chatPlan = buildMessagesForRequest(
    normalizedMessages,
    BEIJING_WORK_PERMIT_REFERENCE,
  );
  if (chatPlan.directResponse) {
    sendSseText(res, chatPlan.directResponse);
    return;
  }

  const messagesForModel = chatPlan.messages ?? chatPlan;

  const upstream = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages: messagesForModel,
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
  const decoder = new TextDecoder();
  let buffer = "";
  req.on("close", () => reader.cancel().catch(() => undefined));

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        const hadCarriageReturn = line.endsWith("\r");
        if (hadCarriageReturn) line = line.slice(0, -1);
        res.write(`${convertUpstreamSseLine(line)}${hadCarriageReturn ? "\r" : ""}\n`);
      }
    }
    buffer += decoder.decode();
    if (buffer) res.write(convertUpstreamSseLine(buffer));
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
