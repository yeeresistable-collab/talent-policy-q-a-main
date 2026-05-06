import { areaMatches, formatWindowRows, type ReferenceIndex } from "./referenceIndex.ts";
import { FINAL_NOTICE } from "./workPermitConfig.ts";
import { inferSlots, isUnclearReply, wantsAllWindows } from "./workPermitNlu.ts";
import type { WorkPermitRuntime } from "./evidence.ts";

type Slots = ReturnType<typeof inferSlots>;

export function buildMandatoryFollowUp(intent: string, slots: Slots, userText: unknown) {
  if (
    intent === "windows" &&
    !slots.current_area &&
    !isUnclearReply(userText) &&
    !wantsAllWindows(userText)
  ) {
    return {
      missingSlot: "current_area",
      question:
        "为了按就近原则推荐办理窗口，请先告诉我您目前在哪个区、哪条路、哪个地铁站、哪个商圈，或公司大致地址。",
    };
  }

  if (intent === "time" && !slots.business_type) {
    return {
      missingSlot: "business_type",
      question: "不同业务的办理时限不同。请先确认您咨询的是新办、延期、变更、注销，还是用人单位注册？",
    };
  }

  if (intent === "materials") {
    if (!slots.business_type) {
      return {
        missingSlot: "business_type",
        question:
          "材料清单需要先对应具体业务类型。请先确认您要办理的是新办、延期、变更、注销，还是用人单位注册？",
      };
    }
    if (slots.business_type === "new" && slots.duration === "longTerm" && !slots.location) {
      return {
        missingSlot: "location",
        question: "90 日以上新办材料会区分境内申请和境外申请。请问申请人目前在中国境内还是中国境外？",
      };
    }
  }

  if (intent === "process" && !slots.business_type) {
    return {
      missingSlot: "business_type",
      question: "办理流程需要先确认业务类型。请问您咨询的是新办、延期、变更、注销，还是用人单位注册？",
    };
  }

  return undefined;
}

export function buildWindowDirectResponse(
  referenceIndex: ReferenceIndex,
  runtime: WorkPermitRuntime,
) {
  if (runtime.intent !== "windows") return undefined;

  const rows = referenceIndex.windows;
  if (rows.length === 0) {
    return `现有办事指南未完整列明办理窗口地址。建议查询外国人来华工作管理服务系统或经办窗口。\n\n${FINAL_NOTICE}`;
  }

  const userWantsAll = wantsAllWindows(runtime.semanticQuestion) || isUnclearReply(runtime.semanticQuestion);
  if (userWantsAll) {
    return `按办事指南，外国人来华工作许可办理服务窗口和站点如下：\n\n${formatWindowRows(rows)}\n\n${FINAL_NOTICE}`;
  }

  if (runtime.slots.current_area) {
    const matched = rows.filter((row) => areaMatches(row.area, runtime.slots.current_area!));
    if (matched.length > 0) {
      const cityRows = rows.filter((row) => row.area === "市级").slice(0, 2);
      const citySection = cityRows.length ? `\n\n市级备选窗口：\n\n${formatWindowRows(cityRows)}` : "";
      return `按您提供的位置，先列出办事指南中对应的区级窗口：\n\n${formatWindowRows(matched)}${citySection}\n\n${FINAL_NOTICE}`;
    }

    const cityRows = rows.filter((row) => row.area === "市级");
    return `办事指南窗口表中未匹配到“${runtime.slots.current_area}”对应的区级窗口。可先咨询市级窗口，也可参考全量窗口表进一步选择：\n\n${formatWindowRows(cityRows.length ? cityRows : rows)}\n\n${FINAL_NOTICE}`;
  }

  return undefined;
}

export function buildShortTermDirectResponse(referenceIndex: ReferenceIndex, runtime: WorkPermitRuntime) {
  if (runtime.slots.duration !== "shortTerm") return undefined;
  if (!["process", "materials", "general"].includes(runtime.intent)) return undefined;

  const shortTermChunk = referenceIndex.chunks.find((chunk) => chunk.tags.includes("shortTerm"));
  if (!shortTermChunk) return undefined;

  return `按办事指南，90 日及以下外国人来华工作许可目前列明了申请条件和所需材料，可按短期工作许可情形准备：

## 申请条件

1. 申请人年龄需满足 **18 周岁至 60 周岁**。
2. 应符合《外国人入境完成短期工作任务的相关办理程序（试行）》中的 **6 种情形**：
   - 到境内合作方完成某项技术、科研、管理、指导等工作；
   - 到境内体育机构进行试训（包括教练员、运动员）；
   - 拍摄影片（包括广告片、纪录片）；
   - 时装表演（包括车模、拍摄平面广告等）；
   - 从事涉外营业性演出（入境进行短期营业性演出的外国文艺表演团体、个人应持有文化主管部门出具的批准文书及在中国短期工作证明）；
   - 人力资源社会保障部门认定的其他情形。
3. 以下情形**不视为完成短期工作任务**：
   - 购买机器设备配套维修、安装、调试、拆卸、指导和培训的；
   - 对在境内中标项目进行指导、监督、检查的；
   - 派往境内分公司、子公司、代表处完成短期工作的；
   - 参加体育赛事的（包括运动员、教练员、队医、助理等相关人员；但根据国际体育组织要求，经我国主管部门批准，持注册卡入境参赛等情况除外）；
   - 入境从事无报酬工作或由境外机构提供报酬的义工和志愿者等；
   - 文化主管部门在批准文书上未注明「涉外营业性演出」的。

## 所需材料

1. **外国人来华工作许可申请表**：在线填写打印，申请人签字（可复印或传真）后，加盖用人单位公章，再上传至系统。**申请人承诺本人无犯罪记录。**
2. **工作合同、项目合同、合作协议**：包括申请人姓名、国籍、工作地点、工作期限、工作内容，并列明所有工作地点和入境次数。
3. **申请人护照或国际旅行证件**：应为护照或国际旅行证件信息页。
4. **其他材料**：许可受理机构或决定机构根据需要要求进行补充提供的材料。

${FINAL_NOTICE}`;
}
