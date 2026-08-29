export interface CraftTip {
  id: string;
  titleZh: string;
  titleEn: string;
  bodyZh: string;
  bodyEn: string;
  sourceRefs: readonly string[];
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
    bodyZh: "南京云锦传统上有织金、库锦、库缎、妆花等品种。本体验聚焦工艺最为繁复的木机妆花，不代表其他织锦。",
    bodyEn: "Traditional Nanjing Yunjin includes zhijin, kujin, kuduan and zhuanghua. This experience focuses on the highly complex hand-woven zhuanghua tradition.",
    sourceRefs: ["ICH-NJ-STRUCTURE", "ICH-MOTIF-2023-A"],
  },
];

export function getCraftTip(seed: number): CraftTip {
  return CRAFT_TIPS[(seed >>> 0) % CRAFT_TIPS.length];
}
