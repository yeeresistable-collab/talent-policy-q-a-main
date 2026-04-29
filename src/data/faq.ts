import { BriefcaseBusiness, GraduationCap, HomeIcon, Users, Wallet, type LucideIcon } from "lucide-react";

export type TopicId = "all" | "settle" | "subsidy" | "housing" | "family" | "workPermit";

export interface Topic {
  id: TopicId;
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
}

export const TOPICS: Topic[] = [
  {
    id: "settle",
    title: "人才引进与落户",
    short: "引进落户",
    description: "A/B/C/D 类人才认定、落户条件、办理流程、所需材料",
    icon: GraduationCap,
  },
  {
    id: "subsidy",
    title: "人才补贴与奖励",
    short: "补贴奖励",
    description: "安家费、生活补贴、创业资助、引才奖励申报",
    icon: Wallet,
  },
  {
    id: "housing",
    title: "住房保障",
    short: "住房保障",
    description: "人才公寓申请、购房补贴、租房补助标准",
    icon: HomeIcon,
  },
  {
    id: "family",
    title: "子女教育与配偶就业",
    short: "教育就业",
    description: "子女入学优待、配偶随调、就业推荐配套服务",
    icon: Users,
  },
  {
    id: "workPermit",
    title: "外国人来华工作许可",
    short: "工作许可",
    description: "工作许可通知、Z 字签证、延期变更注销、证卡融合",
    icon: BriefcaseBusiness,
  },
];

export const FAQS: Record<Exclude<TopicId, "all">, string[]> = {
  settle: [
    "A 类人才落户需要满足什么条件？",
    "申请人才落户需要准备哪些材料？",
    "应届硕士毕业生能否「先落户后就业」？",
    "人才落户的办理流程和时长是多久？",
    "海外留学回国人员如何申请落户？",
    "高级职称人员属于哪一类人才？",
  ],
  subsidy: [
    "博士毕业生的安家费标准是多少？",
    "硕士、本科毕业生有哪些生活补贴？",
    "人才补贴是按月发放还是一次性发放？",
    "创业人才可以申请哪些资助？最高金额多少？",
    "用人单位引才奖励如何申报？",
    "申请补贴需要满足哪些社保和服务期要求？",
  ],
  housing: [
    "人才公寓申请条件是什么？",
    "人才公寓的租金标准如何？租期多长？",
    "购房补贴的比例和最高金额是多少？",
    "租房补贴每月可以领多少？怎么申请？",
    "申请人才公寓的办理流程是什么？",
    "已购房人才还能申请购房补贴吗？",
  ],
  family: [
    "高层次人才子女入学有哪些优待政策？",
    "跨区/跨学段入学如何办理？",
    "配偶随调安置的流程和条件是什么？",
    "市外配偶到本市就业有什么推荐渠道？",
    "子女入园（幼儿园）能否享受优待？",
    "随迁子女中考、高考如何衔接？",
  ],
  workPermit: [
    "外国人来京工作，办理工作许可通知需要先确认哪些事项？",
    "用人单位还没有在外国人来华工作管理服务系统注册，应该准备哪些材料？",
    "外国人来华工作许可 90 日以上新办需要哪些材料？",
    "外国人来华工作许可延期应提前多久办理？需要哪些材料？",
    "外国人工作许可信息变更或注销分别怎么处理？",
    "优秀外籍毕业生办理北京工作许可有哪些便利措施？",
  ],
};

export const HOT_KEYWORDS = [
  "安家费",
  "落户材料",
  "人才公寓",
  "购房补贴",
  "配偶随调",
  "工作许可通知",
  "Z 字签证",
  "创业资助",
  "子女入学",
  "证卡融合",
];

export function getFaqsForTopic(topic: TopicId): string[] {
  if (topic === "all") {
    return [
      FAQS.settle[0],
      FAQS.subsidy[0],
      FAQS.housing[0],
      FAQS.family[0],
      FAQS.workPermit[0],
      FAQS.settle[1],
      FAQS.subsidy[2],
      FAQS.housing[2],
      FAQS.workPermit[3],
    ];
  }
  return FAQS[topic];
}
