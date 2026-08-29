import type { CulturalMotif, IntentId, LayoutId, Palette, PaletteId } from "../core/types";

function mask(rows: readonly string[]): number[][] {
  return rows.map((row) => Array.from(row, (value) => Number(value)));
}

export const PALETTES: Record<PaletteId, Palette> = {
  "indigo-gold": {
    id: "indigo-gold",
    nameZh: "金黄宝蓝",
    nameEn: "Golden Yellow & Sapphire",
    colors: ["#061426", "#E3B34F", "#135792", "#A83A31"],
  },
  "peacock-gold": {
    id: "peacock-gold",
    nameZh: "金翠大红",
    nameEn: "Gold, Green & Red",
    colors: ["#07161B", "#E1B762", "#2A6A4E", "#B43D32"],
  },
  "cinnabar-night": {
    id: "cinnabar-night",
    nameZh: "胭脂湖色",
    nameEn: "Rouge & Lake Blue",
    colors: ["#091322", "#D9AD5A", "#8E3453", "#247F91"],
  },
  "jade-moon": {
    id: "jade-moon",
    nameZh: "金翠雪青",
    nameEn: "Gold, Green & Lavender",
    colors: ["#071713", "#E3B34F", "#34785A", "#80699C"],
  },
};

export const YUNJIN_COLOR_REFERENCE = [
  { familyZh: "黄色系", examplesZh: "金黄、杏黄、姜黄", digitalRole: "金线与高光", color: "#E3B34F" },
  { familyZh: "红色系", examplesZh: "大红、胭脂红、绛色", digitalRole: "彩纬强调", color: "#B43D32" },
  { familyZh: "蓝色系", examplesZh: "湖色、宝蓝", digitalRole: "彩纬与深色地", color: "#135792" },
  { familyZh: "绿色系", examplesZh: "油绿、茶绿、浅绿", digitalRole: "叶色与彩纬", color: "#2A6A4E" },
  { familyZh: "紫色系", examplesZh: "藕荷、雪青、葡灰", digitalRole: "次级晕色", color: "#756481" },
  { familyZh: "棕色系", examplesZh: "豆沙、驼色、古铜", digitalRole: "低亮边饰", color: "#8A5E45" },
] as const;

export const MOTIFS: Record<string, CulturalMotif> = {
  cloud: {
    id: "cloud",
    nameZh: "流云",
    nameEn: "Flowing Cloud",
    traditionalMeaningZh: "云纹在云锦中常参与表达吉祥寓意。",
    traditionalMeaningEn: "Cloud motifs often take part in auspicious expression in Yunjin.",
    contemporaryMappingZh: "本作以连续云线回应平安与长久。",
    contemporaryMappingEn: "Here, continuous cloud lines answer wishes for safety and continuity.",
    bitmapMask: mask(["000011000", "001122100", "012001210", "120112021", "012221210", "001110000"]),
    sourceRefs: ["ICH-MOTIF-2023"],
    reviewStatus: "source-verified",
  },
  roundel: {
    id: "roundel",
    nameZh: "团花构图",
    nameEn: "Roundel",
    traditionalMeaningZh: "团花是云锦常见图案构成形式之一。",
    traditionalMeaningEn: "Roundel is one of the documented composition forms in Yunjin patterns.",
    contemporaryMappingZh: "本作借向心结构表达团聚，不将其宣称为固定历史寓意。",
    contemporaryMappingEn: "A centred structure expresses reunion here without claiming a fixed historic meaning.",
    bitmapMask: mask(["000111000", "011222110", "012101210", "121232121", "012101210", "011222110", "000111000"]),
    sourceRefs: ["ICH-MOTIF-2023"],
    reviewStatus: "source-verified",
  },
  bamboo: {
    id: "bamboo",
    nameZh: "竹影",
    nameEn: "Bamboo",
    traditionalMeaningZh: "梅兰竹菊类题材常与高风亮节相连。",
    traditionalMeaningEn: "The Four Gentlemen motif group is associated with moral character.",
    contemporaryMappingZh: "本作以向上竹节表达成长与勇气。",
    contemporaryMappingEn: "Rising bamboo joints become a contemporary expression of courage.",
    bitmapMask: mask(["0011000", "0121000", "0011000", "0011210", "0011000", "0211000", "0011000", "0011200"]),
    sourceRefs: ["ICH-MOTIF-2023"],
    reviewStatus: "source-verified",
  },
  plum: {
    id: "plum",
    nameZh: "梅枝",
    nameEn: "Plum Branch",
    traditionalMeaningZh: "梅兰竹菊类题材常与高风亮节相连。",
    traditionalMeaningEn: "The Four Gentlemen motif group is associated with moral character.",
    contemporaryMappingZh: "本作将梅枝转译为坚韧与重新出发。",
    contemporaryMappingEn: "A plum branch is translated here into resilience and renewal.",
    bitmapMask: mask(["000010000", "000111000", "010121010", "111232111", "010121010", "000111000", "000010000"]),
    sourceRefs: ["ICH-MOTIF-2023"],
    reviewStatus: "source-verified",
  },
  fish: {
    id: "fish",
    nameZh: "鱼纹",
    nameEn: "Fish",
    traditionalMeaningZh: "鱼在相关云锦纹样阐释中象征富足。",
    traditionalMeaningEn: "Fish signify abundance in documented Yunjin motif readings.",
    contemporaryMappingZh: "本作以成对游鱼回应丰足和收获。",
    contemporaryMappingEn: "Paired swimming fish answer a wish for abundance and harvest.",
    bitmapMask: mask(["000110000", "001221100", "012112210", "121111121", "012112210", "001221100", "000110000"]),
    sourceRefs: ["ICH-MOTIF-2023"],
    reviewStatus: "source-verified",
  },
  peony: {
    id: "peony",
    nameZh: "牡丹",
    nameEn: "Peony",
    traditionalMeaningZh: "牡丹在相关云锦纹样阐释中象征富贵。",
    traditionalMeaningEn: "Peonies signify prosperity in documented Yunjin motif readings.",
    contemporaryMappingZh: "本作以开放花形回应丰足与喜悦。",
    contemporaryMappingEn: "An opening flower answers wishes for abundance and joy.",
    bitmapMask: mask(["001010100", "012121210", "121232121", "012323210", "121232121", "012121210", "001010100"]),
    sourceRefs: ["ICH-MOTIF-2023"],
    reviewStatus: "source-verified",
  },
  magpie: {
    id: "magpie",
    nameZh: "喜鹊",
    nameEn: "Magpie",
    traditionalMeaningZh: "喜鹊在相关云锦纹样阐释中象征喜庆。",
    traditionalMeaningEn: "Magpies signify celebration in documented Yunjin motif readings.",
    contemporaryMappingZh: "本作以抽象鸟形回应喜悦与相聚。",
    contemporaryMappingEn: "An abstract bird form answers joy and reunion here.",
    bitmapMask: mask(["000011000", "000121100", "001221210", "012111100", "121110000", "012100000", "001000000"]),
    sourceRefs: ["ICH-MOTIF-2023"],
    reviewStatus: "source-verified",
  },
  peach: {
    id: "peach",
    nameZh: "桃形",
    nameEn: "Peach Form",
    traditionalMeaningZh: "桃在相关云锦纹样阐释中象征长寿。",
    traditionalMeaningEn: "Peaches signify longevity in documented Yunjin motif readings.",
    contemporaryMappingZh: "本作将桃形与连续线条结合，表达康宁长久。",
    contemporaryMappingEn: "A peach-like form joins continuous lines to express lasting well-being.",
    bitmapMask: mask(["000010000", "000121000", "001212100", "012222210", "012222210", "001222100", "000121000", "000010000"]),
    sourceRefs: ["ICH-MOTIF-2023"],
    reviewStatus: "source-verified",
  },
};

export const INTENT_MOTIFS: Record<IntentId, readonly [string, string]> = {
  safety: ["cloud", "roundel"],
  reunion: ["roundel", "magpie"],
  courage: ["bamboo", "plum"],
  abundance: ["fish", "peony"],
  joy: ["magpie", "peony"],
  longevity: ["peach", "cloud"],
};

export const INTENT_LAYOUTS: Record<IntentId, readonly LayoutId[]> = {
  safety: ["continuous", "combined"],
  reunion: ["roundel", "combined"],
  courage: ["scattered", "combined"],
  abundance: ["continuous", "scattered"],
  joy: ["scattered", "roundel"],
  longevity: ["continuous", "roundel"],
};

export interface MotifStory {
  titleZh: string;
  titleEn: string;
  whyZh: string;
  whyEn: string;
  cultureZh: string;
  cultureEn: string;
  annotationZh: string;
  annotationEn: string;
}

export const MOTIF_STORIES: Record<string, MotifStory> = {
  cloud: {
    titleZh: "守望流云",
    titleEn: "Guardian Clouds",
    whyZh: "云线彼此相连、缓缓延伸，像一份始终不断线的守护。",
    whyEn: "Connected cloud lines extend gently, like care that never breaks.",
    cultureZh: "云纹常参与吉祥表达；用连续云线回应平安，是本作的当代转译。",
    cultureEn: "Cloud motifs often join auspicious expression; linking them with safety is this work's contemporary translation.",
    annotationZh: "云线连续",
    annotationEn: "Connected clouds",
  },
  roundel: {
    titleZh: "相聚团花",
    titleEn: "Reunion Roundel",
    whyZh: "线条从四周向中心靠近，就像远方的人重新相见。",
    whyEn: "Threads gather from four sides toward one centre, like distant people meeting again.",
    cultureZh: "团花是云锦常见图案构成之一；用向心结构表达团聚，是本作的当代转译。",
    cultureEn: "Roundel compositions are documented in Yunjin; using an inward structure for reunion is this work's contemporary translation.",
    annotationZh: "向中心聚拢",
    annotationEn: "Gathering inward",
  },
  bamboo: {
    titleZh: "向上竹影",
    titleEn: "Rising Bamboo",
    whyZh: "竹节一段段向上生长，像鼓起勇气后重新出发。",
    whyEn: "Bamboo joints rise one by one, like finding courage to begin again.",
    cultureZh: "竹属于传统常见题材；用向上竹节表达勇气，是本作的当代转译。",
    cultureEn: "Bamboo is a traditional motif subject; using rising joints for courage is this work's contemporary translation.",
    annotationZh: "竹节向上",
    annotationEn: "Rising joints",
  },
  plum: {
    titleZh: "迎春梅枝",
    titleEn: "Spring Plum",
    whyZh: "枝条穿过留白仍然开花，回应一份坚韧与重新开始。",
    whyEn: "A branch crosses open space and still blossoms, answering resilience and renewal.",
    cultureZh: "梅属于传统常见题材；把它转译为坚韧，是本作的当代设计。",
    cultureEn: "Plum is a traditional motif subject; translating it as resilience is this work's contemporary design.",
    annotationZh: "梅枝新生",
    annotationEn: "Renewing branch",
  },
  fish: {
    titleZh: "双鱼丰年",
    titleEn: "Abundant Pair",
    whyZh: "两尾鱼彼此相望、循环游动，回应对收获与丰足的期盼。",
    whyEn: "Two fish face one another in a continuous swim, answering hopes for harvest and abundance.",
    cultureZh: "鱼在相关云锦纹样阐释中寓意富足；双鱼相望是本作的重新组合。",
    cultureEn: "Fish signify abundance in documented Yunjin readings; the facing pair is this work's recomposition.",
    annotationZh: "双鱼相望",
    annotationEn: "Facing fish",
  },
  peony: {
    titleZh: "盛放牡丹",
    titleEn: "Blooming Peony",
    whyZh: "花瓣由中心向外舒展，把对丰盛生活的期待慢慢打开。",
    whyEn: "Petals open from the centre, unfolding a hope for a flourishing life.",
    cultureZh: "牡丹常与富贵相连；开放花形是本作对丰足的当代回应。",
    cultureEn: "Peonies are associated with prosperity; the opening bloom is this work's contemporary response to abundance.",
    annotationZh: "花瓣盛放",
    annotationEn: "Opening petals",
  },
  magpie: {
    titleZh: "枝头喜讯",
    titleEn: "Joy on the Branch",
    whyZh: "鸟儿停在向上伸展的枝头，像一份刚刚抵达的好消息。",
    whyEn: "A bird rests on a rising branch, like good news that has just arrived.",
    cultureZh: "喜鹊在相关纹样阐释中与喜庆相连；枝头鸟形是本作的抽象重绘。",
    cultureEn: "Magpies are associated with celebration; the bird on a branch is this work's abstract redraw.",
    annotationZh: "喜鹊登枝",
    annotationEn: "Bird on branch",
  },
  peach: {
    titleZh: "长宁桃纹",
    titleEn: "Lasting Peach",
    whyZh: "饱满桃形被连续线条环抱，回应对康宁长久的祝愿。",
    whyEn: "A full peach form is embraced by continuous lines, carrying a wish for lasting well-being.",
    cultureZh: "桃在相关云锦纹样阐释中寓意长寿；连续环抱是本作的当代组合。",
    cultureEn: "Peaches signify longevity in documented Yunjin readings; the continuous embrace is this work's contemporary composition.",
    annotationZh: "桃形环抱",
    annotationEn: "Embraced peach",
  },
};

const INTENT_STORY_OVERRIDES: Partial<Record<`${IntentId}:${string}`, MotifStory>> = {
  "safety:roundel": {
    titleZh: "安宁团花",
    titleEn: "Circle of Safety",
    whyZh: "线条从四周环抱中心，像把一句平安愿望稳稳护在其中。",
    whyEn: "Threads gather around the centre, holding a wish for safety within their circle.",
    cultureZh: "团花是云锦常见图案构成之一；用环抱结构表达守护，是本作的当代转译。",
    cultureEn: "Roundel compositions are documented in Yunjin; using an encircling structure for protection is this work's contemporary translation.",
    annotationZh: "向心守护",
    annotationEn: "Encircling care",
  },
  "reunion:magpie": {
    titleZh: "枝头相逢",
    titleEn: "Meeting on the Branch",
    whyZh: "鸟儿落在伸展的枝头，像一份从远方抵达的相逢喜讯。",
    whyEn: "A bird lands on an extending branch, like welcome news of a reunion arriving from afar.",
    cultureZh: "喜鹊在相关纹样阐释中与喜庆相连；用枝头喜讯回应团聚，是本作的当代组合。",
    cultureEn: "Magpies are associated with celebration; linking news on a branch with reunion is this work's contemporary composition.",
    annotationZh: "喜讯抵达",
    annotationEn: "Welcome news",
  },
  "joy:peony": {
    titleZh: "喜绽花开",
    titleEn: "A Joyful Bloom",
    whyZh: "花瓣从中心向外舒展，像喜悦被一层层打开。",
    whyEn: "Petals open from the centre, unfolding joy layer by layer.",
    cultureZh: "牡丹是传统常见花卉题材；用盛放过程表达喜悦，是本作的当代转译。",
    cultureEn: "Peony is a traditional floral subject; using its opening bloom for joy is this work's contemporary translation.",
    annotationZh: "喜悦盛放",
    annotationEn: "Joy unfolding",
  },
  "longevity:cloud": {
    titleZh: "绵延云纹",
    titleEn: "Enduring Clouds",
    whyZh: "云线首尾相接、缓缓延伸，像一份不间断的长久祝愿。",
    whyEn: "Cloud lines join and extend, like a lasting wish without a break.",
    cultureZh: "云纹常参与吉祥表达；用连续云线回应长久，是本作的当代转译。",
    cultureEn: "Cloud motifs often join auspicious expression; linking continuous clouds with longevity is this work's contemporary translation.",
    annotationZh: "云线绵延",
    annotationEn: "Enduring lines",
  },
};

export function getMotifStory(motifId: string, intentId: IntentId): MotifStory {
  return INTENT_STORY_OVERRIDES[`${intentId}:${motifId}`] ?? MOTIF_STORIES[motifId] ?? MOTIF_STORIES.cloud;
}
