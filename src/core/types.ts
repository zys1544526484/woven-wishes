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
