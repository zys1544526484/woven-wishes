export interface CraftTip {
  id: string;
  titleZh: string;
  titleEn: string;
  bodyZh: string;
  bodyEn: string;
  sourceRefs: readonly string[];
}

export interface WeaveStageTip {
  id: "ground" | "colour" | "gold" | "border";
  eyebrowZh: string;
  eyebrowEn: string;
  titleZh: string;
  titleEn: string;
  bodyZh: string;
  bodyEn: string;
  sourceRefs: readonly string[];
}

/**
 * Short, action-linked facts shown while a visitor weaves. Each fact separates
 * the documented craft relationship from this work's digital interpretation.
 */
export const WEAVE_STAGE_TIPS: readonly WeaveStageTip[] = [
  {
    id: "ground",
    eyebrowZh: "此刻 · 依花本提经",
    eyebrowEn: "Now · lifting from the pattern plan",
    titleZh: "花本指引哪组经线提起",
    titleEn: "The pattern plan guides the warp lift",
    bodyZh: "真实木机妆花中，上方拽花工依花本提经；这里由AI用数字提示转译协作关系，并非织机操作模拟。",
    bodyEn: "In handwoven zhuanghua, the artisan above follows a pattern plan to lift selected warps. Here AI digitally interprets that partnership; it does not simulate loom operation.",
    sourceRefs: ["ICH-NJ-STRUCTURE", "UNESCO-NJ-2009"],
  },
  {
    id: "colour",
    eyebrowZh: "此刻 · 彩纬入纹",
    eyebrowEn: "Now · coloured weft enters",
    titleZh: "妆花可以局部换入彩纬",
    titleEn: "Zhuanghua can change coloured weft locally",
    bodyZh: "织手可按纹样需要在局部换入彩纬，形成逐花配色的丰富效果；你选的色系是本作的数字表达。",
    bodyEn: "The weaver can introduce coloured wefts only where a motif needs them, varying colour flower by flower. Your palette is this work's digital interpretation.",
    sourceRefs: ["ICH-NJ-STRUCTURE", "ICH-COLOR-2023"],
  },
  {
    id: "gold",
    eyebrowZh: "此刻 · 金线显花",
    eyebrowEn: "Now · gold reveals the motif",
    titleZh: "光泽来自材料，也来自组织",
    titleEn: "Lustre comes from material and structure",
    bodyZh: "南京云锦可织入蚕丝与金线等材料，材料光泽与织造结构共同形成灿若云霞的效果；屏幕流光只是视觉转译。",
    bodyEn: "Nanjing Yunjin may weave silk and gold yarns together; their lustre works with the woven structure. The glow on screen is only a visual interpretation.",
    sourceRefs: ["UNESCO-NJ-2009", "ICH-NJ-OVERVIEW"],
  },
  {
    id: "border",
    eyebrowZh: "此刻 · 边饰合拢",
    eyebrowEn: "Now · the border closes",
    titleZh: "真实织造远不止二十四梭",
    titleEn: "The real craft extends far beyond 24 passes",
    bodyZh: "真实云锦还涉及材料准备、纹样设计、挑花结本、造机与织造等多道环节；这二十四梭只帮助理解提经与送梭的协作。",
    bodyEn: "Real Yunjin spans materials, pattern drafting, pattern coding, loom preparation and weaving. These 24 passes only introduce the partnership of lifting and sending.",
    sourceRefs: ["ICH-NJ-OVERVIEW", "UNESCO-NJ-2009"],
  },
] as const;

export function getWeaveStageTip(completedRows: number): WeaveStageTip {
  const index = Math.min(WEAVE_STAGE_TIPS.length - 1, Math.max(0, Math.floor(completedRows / 6)));
  return WEAVE_STAGE_TIPS[index];
}

export const CRAFT_TIPS: readonly CraftTip[] = [
  {
    id: "two-artisans",
    titleZh: "一匹锦，两个人",
    titleEn: "One textile, two artisans",
    bodyZh: "真实的大花楼木织机上，上方拽花工按花本提经，下方织手送纬配色，两人共同完成织造。",
    bodyEn: "On the traditional flower-tower loom, one artisan lifts selected warps above while another sends and colours the weft below.",
    sourceRefs: ["ICH-NJ-STRUCTURE", "UNESCO-NJ-2009"],
  },
  {
    id: "different-colour-each-flower",
    titleZh: "一花一色，层层晕开",
    titleEn: "Colour changes, flower by flower",
    bodyZh: "云锦常见黄、红、绿、蓝、紫、棕等色系；妆花还能局部换入彩纬，形成“逐花异色”的丰富效果。",
    bodyEn: "Yunjin uses rich families of yellow, red, green, blue, purple and brown. Zhuanghua can also change coloured wefts locally, flower by flower.",
    sourceRefs: ["ICH-NJ-STRUCTURE", "ICH-COLOR-2023"],
  },
  {
    id: "meaning-in-pattern",
    titleZh: "图必有意",
    titleEn: "Every pattern carries meaning",
    bodyZh: "南京云锦纹样讲究“图必有意，意必吉祥”。本作因此把你的心愿转成纹样线索，但不冒充历史上的固定搭配。",
    bodyEn: "Nanjing Yunjin patterns are designed to carry auspicious meaning. This work turns your wish into visual cues without claiming a fixed historic formula.",
    sourceRefs: ["ICH-NJ-OVERVIEW"],
  },
  {
    id: "precious-materials",
    titleZh: "丝、金与羽",
    titleEn: "Silk, gold and feather yarn",
    bodyZh: "南京云锦可使用蚕丝、金线，甚至孔雀羽线。材料的光泽与织造结构一起，形成灿若云霞的效果。",
    bodyEn: "Nanjing Yunjin can combine silk, gold and even peacock-feather yarn. Their lustre joins the woven structure to create a cloud-like splendour.",
    sourceRefs: ["UNESCO-NJ-2009", "ICH-NJ-OVERVIEW"],
  },
  {
    id: "hundred-processes",
    titleZh: "不只二十四梭",
    titleEn: "Far more than twenty-four passes",
    bodyZh: "真正的南京云锦从材料准备、纹样设计、挑花结本、造机到织造，包含百余道工序；游戏中的二十四梭只是数字化体验。",
    bodyEn: "Real Nanjing Yunjin involves more than a hundred procedures, from materials and pattern drafting to loom preparation and weaving. The game's twenty-four passes are only a digital experience.",
    sourceRefs: ["ICH-NJ-OVERVIEW", "UNESCO-NJ-2009"],
  },
  {
    id: "four-varieties",
    titleZh: "本作聚焦妆花",
    titleEn: "This work focuses on zhuanghua",
    bodyZh: "南京云锦传统上有织金、库锦、库缎、妆花等品种。本体验聚焦工艺复杂的木机妆花，不代表其他织锦。",
    bodyEn: "Traditional Nanjing Yunjin includes zhijin, kujin, kuduan and zhuanghua. This experience focuses on the highly complex hand-woven zhuanghua tradition.",
    sourceRefs: ["ICH-NJ-STRUCTURE", "ICH-MOTIF-2023-A"],
  },
];

export function getCraftTip(seed: number): CraftTip {
  return CRAFT_TIPS[(seed >>> 0) % CRAFT_TIPS.length];
}
