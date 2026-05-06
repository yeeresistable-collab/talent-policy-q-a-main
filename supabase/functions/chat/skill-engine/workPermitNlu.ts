import { WORK_PERMIT_SKILL_CONFIG } from "./workPermitConfig.ts";
import { applyAliases, getUserMessages, type ChatMsg } from "./text.ts";

export function normalizeSkillText(text: unknown) {
  return applyAliases(text, WORK_PERMIT_SKILL_CONFIG.aliases);
}

export function isWorkPermitQuestion(text: unknown) {
  const compact = normalizeSkillText(text);
  return (
    WORK_PERMIT_SKILL_CONFIG.triggers.some((trigger) => compact.includes(trigger)) ||
    WORK_PERMIT_SKILL_CONFIG.addressTriggers.some((trigger) => compact.includes(trigger))
  );
}

export function classifyIntent(text: unknown) {
  const compact = normalizeSkillText(text);
  if (
    /窗口|站点|哪里办|哪里办理|哪里可以办理|在哪办|在哪里办|去哪办|去哪里办|地址|地点|位置|电话|最近|服务中心|受理机构/.test(compact)
  ) {
    return "windows";
  }
  if (/税单|纳税|个税|薪资事项承诺|工资|收入|6\s*倍|6倍/.test(compact)) return "tax";
  if (/认证|公证|海牙|使领馆认证|学历认证|留学服务中心认证/.test(compact)) return "materials";
  if (/材料|证明|上传|提交|准备|清单/.test(compact)) return "materials";
  if (/多久|时限|几天|提前|有效期|到期|多长时间/.test(compact)) return "time";
  if (/便利|减免|免除|放宽|承诺制|证卡融合/.test(compact)) return "convenience";
  if (/流程|步骤|怎么申请|如何申请|入口|办理|手续|怎么弄|怎么做/.test(compact)) {
    return "process";
  }
  if (/什么|定义|认定|条件|标准|判断|属于/.test(compact)) return "definition";
  return "general";
}

interface Slots {
  business_type?: string;
  duration?: string;
  location?: string;
  talent_tier?: string;
  employer_status?: string;
  current_area?: string;
}

export function inferSlots(messages: ChatMsg[]): Slots {
  const text = normalizeSkillText(getUserMessages(messages).join(" "));
  const slots: Slots = {
    business_type: undefined,
    duration: undefined,
    location: undefined,
    talent_tier: undefined,
    employer_status: undefined,
    current_area: undefined,
  };

  if (/用人单位.*注册|单位账号|法人账号|系统注册/.test(text)) slots.business_type = "employer";
  else if (/延期|延续|到期/.test(text)) slots.business_type = "extension";
  else if (/变更|换单位|换用人单位|护照.*变|岗位.*变/.test(text)) slots.business_type = "change";
  else if (/注销|离职|解除|终止/.test(text)) slots.business_type = "cancellation";
  else if (/确认函|R\s*字|R字/.test(text)) slots.business_type = "confirmationLetter";
  else if (/新办|首次|工作许可通知|Z\s*字|Z字|来京工作|上班|就业|办.*手续/.test(text)) {
    slots.business_type = "new";
  }

  if (/90\s*日(?:及)?以下|90\s*天(?:及)?以下|短期/.test(text)) slots.duration = "shortTerm";
  else if (/90\s*日以上|长期|Z\s*字|Z字/.test(text)) slots.duration = "longTerm";

  if (/境外|国外|还没入境|未入境|中国外/.test(text)) slots.location = "overseas";
  else if (/境内|国内|已入境|在中国|北京/.test(text)) slots.location = "domestic";

  if (/A\s*类|A类|外国高端人才/.test(text)) slots.talent_tier = "aClass";
  else if (/优秀外籍毕业生/.test(text)) slots.talent_tier = "graduate";

  if (/已注册|注册过|完成注册/.test(text)) slots.employer_status = "registered";
  else if (/未注册|没注册|没有注册|第一次聘/.test(text)) slots.employer_status = "unregistered";

  const areaMatch =
    /(东城|西城|朝阳|海淀|丰台|石景山|房山|通州|顺义|昌平|大兴|怀柔|延庆|经开|亦庄|[^，。！？\s]{2,12}(?:路|街|地铁站|商圈))/.exec(text);
  if (areaMatch) slots.current_area = areaMatch[1];

  return slots;
}

export function inferAreaFromText(text: unknown) {
  const normalized = normalizeSkillText(text);
  const areaMatch =
    /(东城|西城|朝阳|海淀|丰台|石景山|房山|通州|顺义|昌平|大兴|怀柔|延庆|经开|亦庄|[^，。！？\s]{2,12}(?:路|街|地铁站|商圈))/.exec(normalized);
  return areaMatch ? areaMatch[1] : undefined;
}

export function normalizeSlotsForIntent(slots: Slots, intent: string): Slots {
  const normalized = { ...slots };

  if (
    !normalized.business_type &&
    (intent === "process" || intent === "materials") &&
    (normalized.duration === "longTerm" || normalized.duration === "shortTerm")
  ) {
    normalized.business_type = "new";
  }

  return normalized;
}

export function isAClassDefinition(text: unknown) {
  const compact = normalizeSkillText(text);
  return /A\s*类|A类|外国高端人才/.test(compact) && /什么|定义|认定|条件|判断|标准|属于/.test(compact);
}

export function isUnclearReply(text: unknown) {
  return /不清楚|不知道|不确定|不明白|不太清楚|不懂|没法判断|无法判断/.test(normalizeSkillText(text));
}

export function wantsGenericExplanation(text: unknown) {
  return /通用|先讲|先说|大概|概览|原则|不管.*情况|都列|全部/.test(normalizeSkillText(text));
}

export function wantsAllWindows(text: unknown) {
  return /各区|不同区域|所有|全部|全量|汇总|列表|一览|有哪些|都有哪些|任何一个区|任意区|任一区|哪个区都行|都可以|随便哪个区/.test(
    normalizeSkillText(text),
  );
}

export function detectPendingSlot(assistantText: unknown) {
  const text = normalizeSkillText(assistantText);
  if (/哪个区|哪条路|地铁站|商圈|大致地址|当前位置/.test(text)) return "current_area";
  if (/中国境内还是中国境外|境内还是境外|境内.*境外/.test(text)) return "location";
  if (/新办、延期、变更、注销|业务类型|单位注册/.test(text)) return "business_type";
  if (/90 日以上|90 日及以下|短期|长期/.test(text)) return "duration";
  if (/A 类|优秀外籍毕业生|常规/.test(text)) return "talent_tier";
  return undefined;
}
