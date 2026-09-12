export const INTENT_IDS = [
  "safety",
  "reunion",
  "courage",
  "abundance",
  "joy",
  "longevity",
] as const;

export type IntentId = (typeof INTENT_IDS)[number];
export type Locale = "zh" | "en";
export type PaletteId = "indigo-gold" | "peacock-gold" | "cinnabar-night" | "jade-moon";
export type LayoutId = "continuous" | "roundel" | "scattered" | "combined";
export type WeaveMode = "player-weaver" | "player-drawboy" | "duo";
export type ProposalId = "A" | "B" | "C";
export type WeaveStageId = "ground" | "colour" | "gold" | "border";
export type GoldTreatmentId = "outline" | "centre";
export type BorderTreatmentId = "continuous" | "balanced";

export interface WishAnalysis {
  primaryIntent: IntentId;
  secondaryIntent?: IntentId;
  scores: Record<IntentId, number>;
  confidence: number;
  fallback: boolean;
  modelVersion: string;
  seed: number;
}

export interface WishProcessingResult {
  status: "ok" | "fallback" | "blocked" | "invalid";
  displayText: string;
  analysis?: WishAnalysis;
  reason?: "too-short" | "too-long" | "unsafe" | "empty";
}

export interface CulturalMotif {
  id: string;
  nameZh: string;
  nameEn: string;
  traditionalMeaningZh: string;
  traditionalMeaningEn: string;
  contemporaryMappingZh: string;
  contemporaryMappingEn: string;
  bitmapMask: number[][];
  sourceRefs: string[];
  reviewStatus: "source-verified" | "expert-reviewed";
}

export interface PatternRecipe {
  version: 1;
  seed: number;
  rows: 24;
  columns: 48;
  primaryMotif: string;
  secondaryMotif?: string;
  palette: PaletteId;
  layout: LayoutId;
  goldTreatment?: GoldTreatmentId;
  borderTreatment?: BorderTreatmentId;
}

export interface PatternProposal {
  id: ProposalId;
  recipe: PatternRecipe;
  /** Present only when the analysed wish contains a qualified second intent. */
  secondaryIntent?: IntentId;
  titleZh: string;
  titleEn: string;
  rationaleZh: string;
  rationaleEn: string;
  culturalBoundaryZh: string;
  culturalBoundaryEn: string;
}

export interface Palette {
  id: PaletteId;
  nameZh: string;
  nameEn: string;
  colors: readonly [string, string, string, string];
}

export type PatternMatrix = number[][];

export interface SharePayloadV1 {
  codecVersion: 1;
  recipe: PatternRecipe;
  locale: Locale;
  wish: string;
  primaryIntent: IntentId;
  secondaryIntent?: IntentId;
}

export interface SharePayloadV2 {
  codecVersion: 2;
  recipe: PatternRecipe;
  locale: Locale;
  wish: string;
  primaryIntent: IntentId;
  secondaryIntent?: IntentId;
  proposalId: ProposalId;
  weaveMode: WeaveMode;
}

export interface SharePayloadV3 extends Omit<SharePayloadV2, "codecVersion"> {
  codecVersion: 3;
  recipe: PatternRecipe & {
    goldTreatment: GoldTreatmentId;
    borderTreatment: BorderTreatmentId;
  };
}

export type SharePayload = SharePayloadV1 | SharePayloadV2 | SharePayloadV3;
