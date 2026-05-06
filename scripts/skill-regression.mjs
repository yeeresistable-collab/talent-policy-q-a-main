const API_URL = process.env.SKILL_TEST_URL ?? "http://localhost:8787/api/chat";

const cases = [
  {
    name: "A 类定义不混入便利和薪资",
    messages: [{ role: "user", content: "A类人才怎么认定？" }],
    good: /外国高端人才|高精尖缺|国内人才引进计划|国际公认的专业成就|创新创业人才/,
    bad: /6倍|平均工资|税单|纳税证明|审批时限|证卡融合|优秀外籍毕业生/,
  },
  {
    name: "泛问材料先追问业务类型",
    messages: [{ role: "user", content: "外国人来华工作许可需要哪些材料？" }],
    good: /新办、延期、变更、注销|如果您不清楚个人情况/,
    bad: /无犯罪记录|体检证明|聘用合同|工作资历证明/,
  },
  {
    name: "追问后不清楚进入兜底",
    messages: [
      { role: "user", content: "外国人来华工作许可需要哪些材料？" },
      {
        role: "assistant",
        content:
          "需要先确认具体情况，以免给错口径。\n\n材料清单需要先对应具体业务类型。请先确认您要办理的是新办、延期、变更、注销，还是用人单位注册？\n\n如果您不清楚个人情况，可以告诉我，我会把所有相关信息告诉您。",
      },
      { role: "user", content: "我不清楚" },
    ],
    good: /用人单位注册|90 日以上|90 日及以下|延期|变更|注销/,
    bad: /请先确认您要办理的是新办、延期、变更、注销/,
  },
  {
    name: "境外 90 日以上流程完整",
    messages: [{ role: "user", content: "90日以上外国人工作许可办理流程，申请人在境外" }],
    good: /工作许可通知|Z 字签证|住宿登记|体检|工作类居留许可|beijingithc\.org\.cn|和平里北街|德政路/,
    bad: /请先确认您咨询的是新办、延期、变更、注销|需要先确认具体情况/,
  },
  {
    name: "90 日以下办理命中短期工作许可",
    messages: [{ role: "user", content: "90日以下工作许可怎么办理？" }],
    good: /18 周岁至 60 周岁|短期工作任务|6 种情形|不视为完成短期工作任务/,
    bad: /请先确认您咨询的是新办、延期、变更、注销|需要先确认具体情况/,
  },
  {
    name: "90 日以下材料命中短期材料",
    messages: [{ role: "user", content: "90日以下工作许可需要什么材料？" }],
    good: /外国人来华工作许可申请表|工作合同|项目合同|合作协议|护照|国际旅行证件/,
    bad: /请先确认您要办理的是新办、延期、变更、注销/,
  },
  {
    name: "不超过 90 日归一到短期许可",
    messages: [{ role: "user", content: "不超过90日的工作证怎么办理？" }],
    good: /18 周岁至 60 周岁|短期工作任务|工作合同|项目合同|合作协议/,
    bad: /请先确认您咨询的是新办、延期、变更、注销|需要先确认具体情况/,
  },
  {
    name: "三个月以内归一到短期许可",
    messages: [{ role: "user", content: "三个月以内来北京上班需要什么材料？" }],
    good: /外国人来华工作许可申请表|工作合同|项目合同|合作协议|护照|国际旅行证件/,
    bad: /请先确认您要办理的是新办、延期、变更、注销/,
  },
  {
    name: "泛问流程先追问业务",
    messages: [{ role: "user", content: "外国人工作许可办理流程是什么？" }],
    good: /新办、延期、变更、注销|如果您不清楚个人情况/,
    bad: /工作许可通知|Z 字签证|和平里北街|德政路/,
  },
  {
    name: "海淀区先区级再市级",
    messages: [{ role: "user", content: "海淀区办理地址" }],
    good: /区级窗口[\s\S]*海淀区人力资源公共服务中心[\s\S]*海淀区中关村壹号[\s\S]*市级备选窗口[\s\S]*丰台区西三环南路1号[\s\S]*海淀区海淀西大街39号/,
  },
  {
    name: "地址汇总返回全量窗口",
    messages: [{ role: "user", content: "办理地址汇总" }],
    good: /北京市政务服务中心|东城区珠市口东大街12号|海淀区西四环北路73号|经济技术开发区万源街4号1层/,
    bad: /请您明确|哪类人才业务|请告诉我具体需求/,
  },
  {
    name: "办理地点归一到窗口地址",
    messages: [{ role: "user", content: "海淀区办理地点在哪里？" }],
    good: /区级窗口[\s\S]*海淀区人力资源公共服务中心[\s\S]*海淀区中关村壹号[\s\S]*市级备选窗口/,
    bad: /请您明确|哪类人才业务|请告诉我具体需求/,
  },
  {
    name: "窗口追问后回答朝阳区命中朝阳窗口",
    messages: [
      { role: "user", content: "哪里可以办理外国人工作许可？" },
      {
        role: "assistant",
        content:
          "需要先确认具体情况，以免给错口径。\n\n为了按就近原则推荐办理窗口，请先告诉我您目前在哪个区、哪条路、哪个地铁站、哪个商圈，或公司大致地址。\n\n如果您不清楚个人情况，可以告诉我，我会把所有相关信息告诉您。",
      },
      { role: "user", content: "朝阳区" },
    ],
    good: /区级窗口[\s\S]*朝阳区人力资源公共服务中心[\s\S]*将台路5号院15号楼A座[\s\S]*朝阳区国际人才一站式服务中心[\s\S]*市级备选窗口/,
    bad: /请您明确|哪类人才业务|请告诉我具体需求|需要先确认具体情况/,
  },
  {
    name: "用户要求繁体时仍输出简体",
    messages: [{ role: "user", content: "請用繁體回答：A类人才怎么认定？" }],
    good: /外国高端人才|高精尖缺/,
    bad: /請|繁體|認定標準|條件|國際|創新|諮詢|辦理/,
  },
  {
    name: "随行家属关系证明认证问答命中小贴士",
    messages: [{ role: "user", content: "随行家属关系证明需要认证吗？" }],
    good: /不需要认证|配偶|未年满 18 周岁的子女|父母及配偶父母|翻译文本扫描件/,
    bad: /使领馆认证|海牙认证|请您补充说明|具体办理事项/,
  },
  {
    name: "材料追问后回答延期继承材料意图",
    messages: [
      { role: "user", content: "外国人来华工作许可需要哪些材料？" },
      {
        role: "assistant",
        content:
          "需要先确认具体情况，以免给错口径。\n\n材料清单需要先对应具体业务类型。请先确认您要办理的是新办、延期、变更、注销，还是用人单位注册？\n\n如果您不清楚个人情况，可以告诉我，我会把所有相关信息告诉您。",
      },
      { role: "user", content: "延期" },
    ],
    good: /外国人来华工作许可延期申请表|聘用合同或任职证明|申请人护照及有效工作类居留许可|有效期届满\s*\*\*30 日前\*\*|有效期届满 30 日前/,
    bad: /90 日以上.*90 日及以下|需要先确认具体情况/,
  },
  {
    name: "流程追问后回答新办继承流程意图",
    messages: [
      { role: "user", content: "外国人工作许可办理流程是什么？" },
      {
        role: "assistant",
        content:
          "需要先确认具体情况，以免给错口径。\n\n办理流程需要先确认业务类型。请问您咨询的是新办、延期、变更、注销，还是用人单位注册？\n\n如果您不清楚个人情况，可以告诉我，我会把所有相关信息告诉您。",
      },
      { role: "user", content: "新办" },
    ],
    good: /90 日以上|90 日及以下|境内|境外|如果您不清楚个人情况/,
    bad: /人才引进与落户|人才补贴/,
  },
];

async function ask(messages) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") break;
      try {
        output += JSON.parse(payload).choices?.[0]?.delta?.content || "";
      } catch {
        // Ignore malformed partial SSE payloads.
      }
    }
  }

  return output;
}

let failures = 0;
for (const testCase of cases) {
  const answer = await ask(testCase.messages);
  const passedGood = testCase.good ? testCase.good.test(answer) : true;
  const passedBad = testCase.bad ? !testCase.bad.test(answer) : true;
  const passed = passedGood && passedBad;
  console.log(`${passed ? "PASS" : "FAIL"} ${testCase.name}`);
  if (!passed) {
    failures += 1;
    console.log(answer);
  }
}

process.exitCode = failures ? 1 : 0;
