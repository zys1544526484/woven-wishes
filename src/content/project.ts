import type { IntentId, Locale } from "../core/types";

export const PROJECT_TITLE_ZH = "一日六厘米";
export const PROJECT_SUBTITLE_ZH = "AI共织锦愿";
export const PROJECT_TITLE_EN = "Six Centimetres a Day";
export const PROJECT_SUBTITLE_EN = "Woven Wishes with AI";

export const EXPERIENCE_DISCLAIMER_ZH = "AI数字锦样 · 受云锦文化启发 · 非真实织造复原";
export const EXPERIENCE_DISCLAIMER_EN =
  "An AI-assisted digital pattern inspired by Yunjin culture — not a reconstruction of the craft.";

export const CRAFT_FACT_ZH =
  "在新华社报道的复杂云锦匹料织造中，拽花工与织手两人配合，一天约织五六厘米。";
export const CRAFT_FACT_EN =
  "In a Xinhua report on complex Yunjin yardage, two artisans working together weave about five to six centimetres a day.";

export interface IntentCopy {
  id: IntentId;
  nameZh: string;
  nameEn: string;
  planZh: string;
  planEn: string;
  resultZh: string;
  resultEn: string;
}

export const INTENT_COPY: Record<IntentId, IntentCopy> = {
  safety: {
    id: "safety",
    nameZh: "平安",
    nameEn: "Safety",
    planZh: "以连续云线承接对平安与守护的愿望。",
    planEn: "Continuous cloud lines carry a wish for safety and care.",
    resultZh: "流动而连续的线条，是本作为平安愿望作出的当代转译。",
    resultEn: "Flowing, continuous lines are this work’s contemporary translation of a wish for safety.",
  },
  reunion: {
    id: "reunion",
    nameZh: "团聚",
    nameEn: "Reunion",
    planZh: "以团式构图聚拢线条，让相隔的心意在中心相遇。",
    planEn: "A gathered composition brings distant threads toward one centre.",
    resultZh: "团式结构是云锦常见构图形式之一；本作借它表达相聚。",
    resultEn: "Roundel structures occur in Yunjin composition; here, they are used to express reunion.",
  },
  courage: {
    id: "courage",
    nameZh: "勇气",
    nameEn: "Courage",
    planZh: "以向上生长的枝线和留白，表达坚韧与重新出发。",
    planEn: "Rising branches and open space suggest resilience and a new beginning.",
    resultZh: "梅、竹属于传统纹样题材；本作将其重新组合为勇气的数字表达。",
    resultEn: "Plum and bamboo are traditional motif subjects; this work recomposes them as a digital expression of courage.",
  },
  abundance: {
    id: "abundance",
    nameZh: "丰足",
    nameEn: "Abundance",
    planZh: "以鱼与花的重复节律，回应对丰足和好收成的期待。",
    planEn: "Repeating fish and flower rhythms answer a hope for abundance and a good harvest.",
    resultZh: "鱼在相关云锦纹样阐释中寓意富足；牡丹常与富贵相连。",
    resultEn: "In documented Yunjin motif readings, fish signify abundance and peonies are associated with prosperity.",
  },
  joy: {
    id: "joy",
    nameZh: "喜悦",
    nameEn: "Joy",
    planZh: "以轻快的鸟形节奏和开放花线，织入一份喜悦。",
    planEn: "Light bird-like rhythms and open floral lines weave in a sense of joy.",
    resultZh: "喜鹊在相关纹样阐释中与喜庆相连；本作以抽象鸟形回应快乐。",
    resultEn: "Magpies are associated with celebration in documented motif readings; an abstract bird form carries that joy here.",
  },
  longevity: {
    id: "longevity",
    nameZh: "长久",
    nameEn: "Longevity",
    planZh: "以连续构图和桃形轮廓，表达对康宁长久的祝愿。",
    planEn: "A continuous layout and peach-like contours express a wish for lasting well-being.",
    resultZh: "桃在相关云锦纹样阐释中寓意长寿；连续构图让祝愿延展开来。",
    resultEn: "Peaches signify longevity in documented Yunjin motif readings; a continuous layout lets the wish extend.",
  },
};

export const PRESETS: Array<{ id: IntentId; zh: string; en: string; wishZh: string; wishEn: string }> = [
  { id: "reunion", zh: "团聚", en: "Reunion", wishZh: "愿远方的家人早日团聚", wishEn: "May families afar be reunited" },
  { id: "safety", zh: "平安", en: "Peace", wishZh: "愿远方的家人平安", wishEn: "May my family afar be safe" },
  { id: "courage", zh: "勇气", en: "Courage", wishZh: "愿我们都有重新出发的勇气", wishEn: "May we find courage to begin again" },
  { id: "abundance", zh: "丰足", en: "Abundance", wishZh: "愿四季丰足，耕耘有收获", wishEn: "May every season bring abundance" },
];

export function localized(locale: Locale, zh: string, en: string): string {
  return locale === "zh" ? zh : en;
}
