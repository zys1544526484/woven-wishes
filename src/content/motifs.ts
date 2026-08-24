import type { CulturalMotif, IntentId, LayoutId, Palette, PaletteId } from "../core/types";

function mask(rows: readonly string[]): number[][] {
  return rows.map((row) => Array.from(row, (value) => Number(value)));
}

export const PALETTES: Record<PaletteId, Palette> = {
  "indigo-gold": {
    id: "indigo-gold",
    nameZh: "靛夜金丝",
    nameEn: "Indigo & Gold",
    colors: ["#061426", "#D6A458", "#08747C", "#A33A2B"],
  },
  "peacock-gold": {
    id: "peacock-gold",
    nameZh: "孔雀青金",
    nameEn: "Peacock & Gold",
    colors: ["#041723", "#E1B96E", "#13939B", "#8D3429"],
  },
  "cinnabar-night": {
    id: "cinnabar-night",
    nameZh: "朱砂夜色",
    nameEn: "Cinnabar Night",
    colors: ["#08111E", "#DAB16C", "#A84332", "#0C7780"],
  },
  "jade-moon": {
    id: "jade-moon",
    nameZh: "玉青月白",
    nameEn: "Jade & Moonlight",
    colors: ["#061720", "#E5D9B9", "#3A9A91", "#C89A4B"],
  },
};

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
    nameZh: "团式",
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
