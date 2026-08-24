import { describe, expect, it } from "vitest";
import { composePattern, generatePatternMatrix, patternHash } from "../src/core/pattern";
import type { WishAnalysis } from "../src/core/types";

const analysis: WishAnalysis = {
  primaryIntent: "reunion",
  secondaryIntent: "joy",
  scores: { safety: 0.05, reunion: 0.6, courage: 0.05, abundance: 0.05, joy: 0.2, longevity: 0.05 },
  confidence: 0.6,
  fallback: false,
  modelVersion: "test",
  seed: 123456789,
};

describe("deterministic pattern generation", () => {
  it("always produces the same 48 by 24 matrix", () => {
    const recipeA = composePattern(analysis);
    const recipeB = composePattern(analysis);
    const matrixA = generatePatternMatrix(recipeA);
    const matrixB = generatePatternMatrix(recipeB);
    expect(matrixA).toHaveLength(24);
    expect(matrixA.every((row) => row.length === 48)).toBe(true);
    expect(patternHash(matrixA)).toBe(patternHash(matrixB));
  });

  it("uses a source-approved generic cloud for fallback", () => {
    const recipe = composePattern({ ...analysis, fallback: true, primaryIntent: "abundance" });
    expect(recipe.primaryMotif).toBe("cloud");
  });
});
