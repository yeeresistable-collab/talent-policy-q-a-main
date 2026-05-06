import { normalizeText } from "./text.ts";

export interface ReferenceChunk {
  title: string;
  level: number;
  content: string;
  tags: string[];
}

export interface WindowRow {
  area: string;
  agency: string;
  address: string;
  phone: string;
  hours: string;
}

export interface ReferenceIndex {
  chunks: ReferenceChunk[];
  windows: WindowRow[];
}

export function buildReferenceIndex(referenceText: string): ReferenceIndex {
  const chunks = splitReferenceIntoChunks(referenceText);
  return {
    chunks,
    windows: parseWindowRows(referenceText),
  };
}

type ChunkDraft = { title: string; level: number; content: string[] };

export function splitReferenceIntoChunks(referenceText: string): ReferenceChunk[] {
  const lines = referenceText.split(/\r?\n/);
  const chunks: ChunkDraft[] = [];
  let current: ChunkDraft | null = null;
  const headingStack: { level: number; title: string }[] = [];

  for (const line of lines) {
    const heading = /^(#{2,4})\s+(.+)$/.exec(line);
    if (heading) {
      if (current) chunks.push(current);
      const level = heading[1].length;
      const rawTitle = heading[2].trim();
      while (headingStack.length && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      headingStack.push({ level, title: rawTitle });
      current = {
        title: headingStack.map((item) => item.title).join(" > "),
        level,
        content: [line],
      };
      continue;
    }

    if (!current) {
      current = {
        title: "文档约束与总则",
        level: 1,
        content: [],
      };
    }
    current.content.push(line);
  }

  if (current) chunks.push(current);

  return chunks.map((chunk) => {
    const content = chunk.content.join("\n").trim();
    return {
      title: chunk.title,
      level: chunk.level,
      content,
      tags: getChunkTags(chunk.title, content),
    };
  });
}

export function getChunkTags(title: string, content: string): string[] {
  const text = `${title}\n${content}`;
  const tags = new Set<string>();
  const isFaqTitle = /[？?]/.test(title) || /^.+\d+\.\s*.+$/.test(title);

  if (title.includes("总则") || title.includes("系统")) tags.add("general");
  if (title.includes("办理流程")) tags.add("process");
  if (title.includes("境外")) tags.add("overseas");
  if (title.includes("境内")) tags.add("domestic");
  if (title.includes("用人单位信息注册") || title.includes("系统注册")) tags.add("employer");
  if (title.includes("90 日以上")) tags.add("longTerm");
  if (title.includes("90 日及以下") || title.includes("短期")) tags.add("shortTerm");
  if (title.includes("高端人才确认函")) tags.add("confirmationLetter");
  if (title.includes("延期")) tags.add("extension");
  if (title.includes("变更")) tags.add("change");
  if (title.includes("注销")) tags.add("cancellation");
  if (title.includes("便利措施")) tags.add("convenience");
  if (title.includes("小贴士")) tags.add("tips");
  if (title.includes("办理服务窗口") || title.includes("站点")) tags.add("windows");
  if (/所需材料|证明材料|材料清单|上传至系统/.test(text)) tags.add("materials");
  if (/认证|海牙|公约国|使、领馆|学历认证|留学服务中心/.test(text)) tags.add("materials");
  if (/认证|海牙|公约国|使、领馆|留学服务中心/.test(text)) tags.add("process");
  if (/申请条件|认定标准|纳入.*认定范围|外国高端人才（A 类）标准/.test(text)) {
    tags.add("condition");
  }
  if (/审批时限|预审期限|审查期限|有效期|工作日|提前/.test(text)) tags.add("time");
  if (/定义|即外国高端人才|高精尖缺|分类标准/.test(text)) tags.add("definition");
  if (/税单|纳税|薪资事项承诺/.test(text)) tags.add("tax");
  if (isFaqTitle) tags.add("faq");

  if (tags.size === 0) tags.add("general");
  return Array.from(tags);
}

export function parseWindowRows(referenceText: string): WindowRow[] {
  const rows: WindowRow[] = [];
  const lines = referenceText.split(/\r?\n/);
  let inWindowSection = false;

  for (const line of lines) {
    if (line.startsWith("## （10）办理服务窗口和站点")) {
      inWindowSection = true;
      continue;
    }
    if (inWindowSection && line.startsWith("---")) break;
    if (!inWindowSection || !line.startsWith("|")) continue;
    if (line.includes("序号") || line.includes(":---")) continue;

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 6) continue;

    rows.push({
      area: cells[1],
      agency: cells[2],
      address: cells[3],
      phone: cells[4],
      hours: cells[5],
    });
  }

  return rows;
}

export function areaMatches(rowArea: string, currentArea: string) {
  const area = normalizeText(rowArea);
  const current = normalizeText(currentArea);
  if (!current) return false;
  if (area.includes(current) || current.includes(area)) return true;
  if (current.includes("朝阳") && area.includes("朝阳")) return true;
  if (current.includes("海淀") && area.includes("海淀")) return true;
  if (current.includes("丰台") && area.includes("丰台")) return true;
  if ((current.includes("亦庄") || current.includes("经开")) && area.includes("经济技术开发区")) {
    return true;
  }
  return false;
}

export function formatWindowRows(rows: WindowRow[]) {
  const header = "| 行政区域 | 受理机构 | 地址 | 咨询电话 | 工作时间 |\n|---|---|---|---|---|";
  const body = rows
    .map((row) => `| ${row.area} | ${row.agency} | ${row.address} | ${row.phone} | ${row.hours} |`)
    .join("\n");
  return `${header}\n${body}`;
}
