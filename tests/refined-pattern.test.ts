import { describe, expect, it } from "vitest";
import type { PatternRecipe } from "../src/core/types";
import {
  createRefinedPatternPlan,
  getRefinedStageState,
  refinedPatternSignature,
} from "../src/render/refinedPattern";

const baseRecipe: PatternRecipe = {
  version: 1,
  seed: 20260829,
  rows: 24,
  columns: 48,
  primaryMotif: "roundel",
  secondaryMotif: "magpie",
  palette: "peacock-gold",
  layout: "combined",
};

describe("high-density refined pattern plan", () => {
  it("is deterministic for the same complete recipe", () => {
    expect(createRefinedPatternPlan(baseRecipe)).toEqual(createRefinedPatternPlan({ ...baseRecipe }));
    expect(refinedPatternSignature(baseRecipe, 24)).toBe(refinedPatternSignature({ ...baseRecipe }, 24));
  });

  it("changes actual drawing instructions for seed, layout, motif and secondary motif", () => {
    const plans = [
      createRefinedPatternPlan(baseRecipe),
      createRefinedPatternPlan({ ...baseRecipe, seed: baseRecipe.seed + 1 }),
      createRefinedPatternPlan({ ...baseRecipe, layout: "continuous" }),
      createRefinedPatternPlan({ ...baseRecipe, primaryMotif: "bamboo" }),
      createRefinedPatternPlan({ ...baseRecipe, secondaryMotif: "plum" }),
    ];

    expect(plans[1]).not.toEqual(plans[0]);
    expect(plans[2].placements.map(({ centerX, centerY, size }) => [centerX, centerY, size]))
      .not.toEqual(plans[0].placements.map(({ centerX, centerY, size }) => [centerX, centerY, size]));
    expect(plans[3].placements[0].motifId).toBe("bamboo");
    expect(plans[4].placements.some(({ motifId }) => motifId === "plum")).toBe(true);
    expect(new Set([
      refinedPatternSignature(baseRecipe, 24),
      refinedPatternSignature({ ...baseRecipe, seed: baseRecipe.seed + 1 }, 24),
      refinedPatternSignature({ ...baseRecipe, layout: "continuous" }, 24),
      refinedPatternSignature({ ...baseRecipe, primaryMotif: "bamboo" }, 24),
      refinedPatternSignature({ ...baseRecipe, secondaryMotif: "plum" }, 24),
    ]).size).toBe(5);
  });

  it("uses distinct placement topology for all four composition layouts", () => {
    const layouts = ["continuous", "roundel", "scattered", "combined"] as const;
    const topology = layouts.map((layout) => {
      const plan = createRefinedPatternPlan({ ...baseRecipe, layout, secondaryMotif: undefined });
      return plan.placements.map(({ centerX, centerY, size, mirror }) => (
        `${centerX.toFixed(3)},${centerY.toFixed(3)},${size.toFixed(3)},${mirror ? 1 : 0}`
      )).join(";");
    });
    expect(new Set(topology).size).toBe(layouts.length);
  });

  it("reveals ground, colour, gold and border as four semantic layers", () => {
    expect(getRefinedStageState(0)).toMatchObject({ ground: 0, colour: 0, gold: 0, border: 0 });
    expect(getRefinedStageState(6)).toMatchObject({ ground: 1, colour: 0, gold: 0, border: 0, activeStage: "ground" });
    expect(getRefinedStageState(12)).toMatchObject({ ground: 1, colour: 1, gold: 0, border: 0, activeStage: "colour" });
    expect(getRefinedStageState(18)).toMatchObject({ ground: 1, colour: 1, gold: 1, border: 0, activeStage: "gold" });
    expect(getRefinedStageState(24)).toMatchObject({ ground: 1, colour: 1, gold: 1, border: 1, activeStage: "border" });
    expect(new Set([6, 12, 18, 24].map((rows) => refinedPatternSignature(baseRecipe, rows))).size).toBe(4);
  });

  it("varies border, mirroring and scale across a useful seed sample", () => {
    const plans = Array.from({ length: 24 }, (_, index) => createRefinedPatternPlan({ ...baseRecipe, seed: 1000 + index }));
    expect(new Set(plans.map(({ borderVariant }) => borderVariant)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(plans.map(({ borderStartSegment }) => borderStartSegment)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(plans.map(({ placements }) => placements[0].mirror)).size).toBe(2);
    expect(new Set(plans.map(({ placements }) => placements[0].size.toFixed(3))).size).toBeGreaterThanOrEqual(8);
  });

  it("turns the player's gold and border decisions into deterministic render instructions", () => {
    const outlined = { ...baseRecipe, goldTreatment: "outline" as const, borderTreatment: "continuous" as const };
    const centred = { ...baseRecipe, goldTreatment: "centre" as const, borderTreatment: "balanced" as const };
    expect(createRefinedPatternPlan(outlined).goldTreatment).toBe("outline");
    expect(createRefinedPatternPlan(outlined).borderVariant % 3).toBe(0);
    expect(createRefinedPatternPlan(centred).goldTreatment).toBe("centre");
    expect(createRefinedPatternPlan(centred).borderVariant % 3).toBe(1);
    expect(refinedPatternSignature(outlined)).not.toBe(refinedPatternSignature(centred));
  });
});
