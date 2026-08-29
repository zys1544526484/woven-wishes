import type { Locale, WeaveMode } from "../core/types";

export const COLLABORATION_SUMMARY: Record<WeaveMode, { zh: string; en: string }> = {
  "player-weaver": { zh: "你送梭 · AI辅助提经", en: "You send the shuttle · AI assists the lift" },
  "player-drawboy": { zh: "你提经 · AI辅助送梭", en: "You lift the warps · AI sends the shuttle" },
  duo: { zh: "两人配合 · 一人提经，一人送梭", en: "Two people · one lifts, one sends the shuttle" },
};

export function collaborationSummary(locale: Locale, mode: WeaveMode): string {
  const copy = COLLABORATION_SUMMARY[mode];
  return locale === "zh" ? copy.zh : copy.en;
}
