import type { IntentId, PatternProposal, PatternRecipe, ProposalId } from "../core/types";
import { getMotifStory } from "./motifs";

interface ProposalCopy {
  titleZh: string;
  titleEn: string;
  rationaleZh: string;
  rationaleEn: string;
  culturalBoundaryZh: string;
  culturalBoundaryEn: string;
}

const COMPOSITE_PROPOSAL_COPY: Record<IntentId, ProposalCopy> = {
  safety: {
    titleZh: "安宁云环",
    titleEn: "Clouds of Calm",
    rationaleZh: "连续云线环抱团花中心，把平安愿望安稳收拢。",
    rationaleEn: "Continuous cloud lines encircle a roundel, gathering the wish for safety.",
    culturalBoundaryZh: "云纹与团花构图均见于云锦资料；二者组合表达守护，是本作的当代转译。",
    culturalBoundaryEn: "Cloud motifs and roundel compositions are documented in Yunjin; combining them for protection is this work's contemporary translation.",
  },
  reunion: {
    titleZh: "喜相逢团花",
    titleEn: "Joyful Reunion Roundel",
    rationaleZh: "枝头喜讯向团花中心靠近，像远方的人重新相逢。",
    rationaleEn: "Good news on a branch gathers toward a roundel, like distant people meeting again.",
    culturalBoundaryZh: "喜鹊题材与团花构图均有资料依据；用它们表达团聚，是本作的重新组合。",
    culturalBoundaryEn: "Magpie subjects and roundel compositions are documented; using them for reunion is this work's recomposition.",
  },
  courage: {
    titleZh: "梅竹新生",
    titleEn: "Plum and Bamboo Renewed",
    rationaleZh: "竹节向上、梅枝穿过留白，共同回应重新出发的勇气。",
    rationaleEn: "Rising bamboo and a plum branch crossing open space answer the courage to begin again.",
    culturalBoundaryZh: "梅、竹属于传统常见题材；将二者组合为勇气叙事，是本作的当代设计。",
    culturalBoundaryEn: "Plum and bamboo are traditional subjects; combining them as a story of courage is this work's contemporary design.",
  },
  abundance: {
    titleZh: "鱼跃花开",
    titleEn: "Fish Among Blossoms",
    rationaleZh: "游鱼与盛放花形彼此呼应，把收获与丰足织进同一幅画面。",
    rationaleEn: "Swimming fish and an opening bloom weave harvest and abundance into one composition.",
    culturalBoundaryZh: "鱼与牡丹在相关纹样阐释中分别联系富足与富贵；此处组合为本作当代转译。",
    culturalBoundaryEn: "Fish and peonies are respectively linked with abundance and prosperity in documented readings; this pairing is a contemporary translation.",
  },
  joy: {
    titleZh: "喜上花枝",
    titleEn: "Joy on a Flowering Branch",
    rationaleZh: "喜鹊落在盛放花枝旁，让好消息像花一样逐层展开。",
    rationaleEn: "A magpie settles by an opening bloom, letting good news unfold like a flower.",
    culturalBoundaryZh: "喜鹊与牡丹均为传统常见题材；用花枝承接喜讯，是本作的抽象重绘。",
    culturalBoundaryEn: "Magpie and peony are traditional subjects; placing good news on a flowering branch is this work's abstract redraw.",
  },
  longevity: {
    titleZh: "桃云绵延",
    titleEn: "Peach and Enduring Clouds",
    rationaleZh: "桃形被连续云线环抱，让长久祝愿顺着纹样不断延伸。",
    rationaleEn: "A peach form is embraced by continuous clouds, extending a wish for lasting well-being.",
    culturalBoundaryZh: "桃与云纹均见于相关云锦纹样阐释；连续环抱是本作的当代组合。",
    culturalBoundaryEn: "Peach and cloud motifs appear in documented Yunjin readings; the continuous embrace is this work's contemporary composition.",
  },
};

export function createPatternProposal(id: ProposalId, intent: IntentId, recipe: PatternRecipe): PatternProposal {
  if (id === "C") return { id, recipe, ...COMPOSITE_PROPOSAL_COPY[intent] };
  const story = getMotifStory(recipe.primaryMotif, intent);
  return {
    id,
    recipe,
    titleZh: story.titleZh,
    titleEn: story.titleEn,
    rationaleZh: story.whyZh,
    rationaleEn: story.whyEn,
    culturalBoundaryZh: story.cultureZh,
    culturalBoundaryEn: story.cultureEn,
  };
}

export function proposalFromRecipe(id: ProposalId, intent: IntentId, recipe: PatternRecipe): PatternProposal {
  return createPatternProposal(id, intent, recipe);
}
