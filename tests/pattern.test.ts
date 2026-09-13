import { describe, expect, it } from "vitest";
import { composePattern, composePatternProposals, generatePatternMatrix, patternHash } from "../src/core/pattern";
import { PRESETS } from "../src/content/project";
import { MOTIF_ATLAS_REGIONS } from "../src/render/refinedPattern";
import type { PatternRecipe, WishAnalysis } from "../src/core/types";

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

  it("offers three stable and visibly distinct pattern plans", () => {
    const first = composePatternProposals(analysis);
    const second = composePatternProposals(analysis);
    expect(first).toHaveLength(3);
    expect(first).toEqual(second);
    expect(new Set(first.map((proposal) => patternHash(generatePatternMatrix(proposal.recipe)))).size).toBe(3);
    expect(new Set(first.map((proposal) => proposal.recipe.layout)).size).toBe(3);
    expect(new Set(first.map((proposal) => proposal.titleZh)).size).toBe(3);
    expect(first.every((proposal) => proposal.recipe.rows === 24 && proposal.recipe.columns === 48)).toBe(true);
    expect(first[2].recipe.secondaryMotif).toBeDefined();
  });

  it("uses a source-approved generic cloud for fallback", () => {
    const recipe = composePattern({ ...analysis, fallback: true, primaryIntent: "abundance" });
    expect(recipe.primaryMotif).toBe("cloud");
  });

  it("draws eight distinct, large hero motifs instead of repeating tiny tiles", () => {
    const motifIds = ["cloud", "roundel", "bamboo", "plum", "fish", "peony", "magpie", "peach"];
    const matrices = motifIds.map((primaryMotif, index) => generatePatternMatrix({
      version: 1,
      seed: 1000 + index,
      rows: 24,
      columns: 48,
      primaryMotif,
      palette: "peacock-gold",
      layout: "roundel",
    } satisfies PatternRecipe));

    expect(new Set(matrices.map(patternHash)).size).toBe(motifIds.length);
    matrices.forEach((matrix) => {
      const motifCells = matrix.flatMap((row, y) => row.map((value, x) => ({ value, x, y })))
        .filter(({ value, y }) => value !== 0 && y >= 2 && y < 22);
      const xs = motifCells.map(({ x }) => x);
      const ys = motifCells.map(({ y }) => y);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(18);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(12);
    });
  });

  it("uses wording-derived seeds to vary motif, layout, border and colour within one intent", () => {
    const recipes = Array.from({ length: 64 }, (_, index) => composePattern({ ...analysis, seed: index + 1, secondaryIntent: undefined }));
    expect(new Set(recipes.map((recipe) => recipe.primaryMotif)).size).toBeGreaterThanOrEqual(2);
    expect(new Set(recipes.map((recipe) => recipe.layout)).size).toBeGreaterThanOrEqual(2);
    expect(new Set(recipes.map((recipe) => recipe.palette)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(recipes.map((recipe) => patternHash(generatePatternMatrix(recipe)))).size).toBeGreaterThanOrEqual(12);
  });

  it("makes all four layout recipes visibly distinct", () => {
    const layouts = ["continuous", "roundel", "scattered", "combined"] as const;
    const hashes = layouts.map((layout) => patternHash(generatePatternMatrix({
      version: 1,
      seed: 20260826,
      rows: 24,
      columns: 48,
      primaryMotif: "bamboo",
      secondaryMotif: "plum",
      palette: "indigo-gold",
      layout,
    })));
    expect(new Set(hashes).size).toBe(layouts.length);
  });

  it("exposes all six intent families as playable starting points", () => {
    expect(PRESETS.map((preset) => preset.id)).toEqual([
      "reunion", "safety", "courage", "abundance", "joy", "longevity",
    ]);
  });

  it("keeps animal subjects visually connected at 48 by 24 resolution", () => {
    for (const primaryMotif of ["fish", "magpie"]) {
      const matrix = generatePatternMatrix({
        version: 1,
        seed: 20260827,
        rows: 24,
        columns: 48,
        primaryMotif,
        palette: "indigo-gold",
        layout: "roundel",
      });
      const largestInteriorRowMass = Math.max(...matrix.slice(3, 21).map((row) => row.filter(Boolean).length));
      expect(largestInteriorRowMass).toBeGreaterThanOrEqual(14);
    }
  });

  it("has a refined atlas panel for every approved motif", () => {
    expect(Object.keys(MOTIF_ATLAS_REGIONS).sort()).toEqual([
      "bamboo", "bamboo-plum", "cloud", "cloud-roundel", "fish", "fish-peony", "magpie", "magpie-peony", "peach", "peach-cloud", "peony", "plum", "roundel", "roundel-magpie",
    ]);
  });
});
