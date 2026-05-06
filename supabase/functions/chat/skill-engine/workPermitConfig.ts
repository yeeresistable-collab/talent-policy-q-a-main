export interface WorkPermitSkillConfig {
  triggers: string[];
  addressTriggers: string[];
  aliases: { from: string; to: string }[];
}

export let APP_SKILL_PROMPT = "";
export let WORK_PERMIT_SKILL_CONFIG: WorkPermitSkillConfig = {
  triggers: [],
  addressTriggers: [],
  aliases: [],
};

export function setWorkPermitKnowledge(skillMarkdown: string, skillConfig: WorkPermitSkillConfig) {
  APP_SKILL_PROMPT = skillMarkdown;
  WORK_PERMIT_SKILL_CONFIG = skillConfig;
}

export const BASE_POLICY_PROMPT = `你是一名隶属于市人才工作领导小组办公室的“外国人来华工作许可”政务助手。请用简体中文，以亲切、严谨、规范的政务语气回答用户问题。

【职责范围】
你只回答“北京市外国人来华工作许可”相关问题，包括但不限于：
1. 工作许可通知、Z 字签证、90 日以上/以下办理路径；
2. 用人单位注册、新办、延期、变更、注销；
3. A 类、外国高端人才确认函、优秀外籍毕业生、便利措施、证卡融合；
4. 材料、流程、时限、窗口与咨询方式。

【回答规范】
- 结构清晰：优先使用 Markdown 列表、加粗关键词、必要时用小标题。
- 必须使用简体中文输出，即使用户要求繁体，也不得输出繁体字。
- 实事求是：资料没有覆盖用户所问要点时，请明确说明边界，不要用常识补全。
- 仅在用户问题需要时给出申请入口、办理地点、材料、时限等落地指引。
- 不回答与“外国人来华工作许可”无关的问题，礼貌引导用户回到该主题。
- 每次回答末尾附一行温馨提示：「以上信息仅供参考，最终以现行有效的政府文件和经办窗口解释为准。」`;

export const FINAL_NOTICE =
  "以上信息仅供参考，最终以现行有效的政府文件和经办窗口解释为准。";
