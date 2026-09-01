import { describe, expect, it } from "vitest";
import { appReducer, initialState, type AppState } from "../src/app/state";
import { createPatternProposal } from "../src/content/proposals";

const recipe = {
  version: 1 as const,
  seed: 7,
  rows: 24 as const,
  columns: 48 as const,
  primaryMotif: "cloud",
  palette: "indigo-gold" as const,
  layout: "continuous" as const,
};
const matrix = Array.from({ length: 24 }, () => Array.from({ length: 48 }, () => 0));

describe("weaving progress state", () => {
  it("cannot advance past exactly 24 rows", () => {
    let state: AppState = { ...initialState, phase: "weaving" };
    for (let row = 0; row < 30; row += 1) {
      state = appReducer(state, { type: "START_ROW", row });
      state = appReducer(state, { type: "COMMIT_ROW" });
    }
    expect(state.completedRows).toBe(24);
  });

  it("keeps player authorship between AI analysis and weaving", () => {
    let state = appReducer(initialState, {
      type: "START_ANALYSIS",
      wish: "愿家人团聚",
      analysis: {
        primaryIntent: "reunion",
        scores: { safety: 0, reunion: 1, courage: 0, abundance: 0, joy: 0, longevity: 0 },
        confidence: 1,
        fallback: false,
        modelVersion: "test",
        seed: 7,
      },
      proposals: [
        createPatternProposal("A", "reunion", recipe),
        createPatternProposal("B", "reunion", { ...recipe, seed: 8, layout: "roundel" }),
      ],
      recipe,
      matrix,
    });
    state = appReducer(state, { type: "OPEN_PLAN_SELECTION" });
    expect(state.phase).toBe("plan-selection");
    expect(state.planChosen).toBe(false);
    state = appReducer(state, { type: "CONFIRM_PLAN" });
    expect(state.phase).toBe("plan-selection");
    state = appReducer(state, { type: "SELECT_PLAN", index: 1, recipe: { ...recipe, seed: 8, layout: "roundel" }, matrix });
    expect(state.selectedCandidate).toBe(1);
    expect(state.planChosen).toBe(true);
    state = appReducer(state, { type: "SELECT_PALETTE", palette: "cinnabar-night", recipe: { ...recipe, palette: "cinnabar-night" }, matrix });
    expect(state.selectedPalette).toBe("cinnabar-night");
    state = appReducer(state, { type: "CONFIRM_PLAN" });
    state = appReducer(state, { type: "SET_WEAVE_MODE", mode: "duo" });
    state = appReducer(state, { type: "START_WEAVING" });
    expect(state.phase).toBe("weaving");
    expect(state.weaveMode).toBe("duo");
  });
});
