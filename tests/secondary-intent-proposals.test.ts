import { describe, expect, it } from "vitest";
import { INTENT_MOTIFS } from "../src/content/motifs";
import { proposalFromRecipe } from "../src/content/proposals";
import { composePatternProposals, generatePatternMatrix, patternHash } from "../src/core/pattern";
import { INTENT_IDS, type IntentId, type WishAnalysis } from "../src/core/types";

function analysisFor(primaryIntent: IntentId, secondaryIntent: IntentId, seed = 20260829): WishAnalysis {
  const scores = Object.fromEntries(INTENT_IDS.map((intent) => [intent, 0.01])) as Record<IntentId, number>;
  scores[primaryIntent] = 0.64;
  scores[secondaryIntent] = 0.46;
  return {
    primaryIntent,
    secondaryIntent,
    scores,
    confidence: scores[primaryIntent],
    fallback: false,
    modelVersion: "mixed-intent-test",
    seed,
  };
}

describe("mixed-wish pattern proposals", () => {
  it("uses the primary subject for A, the qualified secondary subject for B, and both for C", () => {
    const analysis = analysisFor("safety", "reunion");
    const proposals = composePatternProposals(analysis);

    expect(INTENT_MOTIFS.safety).toContain(proposals[0].recipe.primaryMotif);
    expect(INTENT_MOTIFS.reunion).toContain(proposals[1].recipe.primaryMotif);
    expect(proposals[2].recipe.primaryMotif).toBe(proposals[0].recipe.primaryMotif);
    expect(proposals[2].recipe.secondaryMotif).toBe(proposals[1].recipe.primaryMotif);
    expect(proposals.every((proposal) => proposal.secondaryIntent === "reunion")).toBe(true);
    expect(proposals[2].titleZh).toBe("平安·团聚合景");
    expect(proposals[2].titleEn).toBe("Safety & Reunion");
    expect(proposals[2].culturalBoundaryZh).toContain("不代表南京云锦中的固定历史寓意");
  });

  it("keeps every qualified primary-secondary pair deterministic and visibly distinct", () => {
    for (const primary of INTENT_IDS) {
      for (const secondary of INTENT_IDS) {
        if (primary === secondary) continue;
        const analysis = analysisFor(primary, secondary, 1000 + INTENT_IDS.indexOf(primary) * 10 + INTENT_IDS.indexOf(secondary));
        const first = composePatternProposals(analysis);
        const second = composePatternProposals(analysis);
        expect(first).toEqual(second);
        expect(new Set(first.map((proposal) => proposal.titleZh)).size).toBe(3);
        expect(new Set(first.map((proposal) => proposal.recipe.layout)).size).toBe(3);
        expect(new Set(first.map((proposal) => patternHash(generatePatternMatrix(proposal.recipe)))).size).toBe(3);
      }
    }
  });

  it("ignores a stale secondary label when its score does not meet the product threshold", () => {
    const analysis = analysisFor("safety", "joy");
    analysis.scores.joy = 0.2;
    const proposals = composePatternProposals(analysis);
    const withoutSecondary = composePatternProposals({ ...analysis, secondaryIntent: undefined });

    expect(proposals.every((proposal) => proposal.secondaryIntent === undefined)).toBe(true);
    expect(INTENT_MOTIFS.safety).toContain(proposals[1].recipe.primaryMotif);
    expect(proposals[2].titleZh).toBe("云结平安");
    expect(proposals).toEqual(withoutSecondary);
  });

  it("reconstructs mixed B and C copy from a V2 share payload without inventing historic meaning", () => {
    const proposals = composePatternProposals(analysisFor("reunion", "joy"));
    const rebuiltB = proposalFromRecipe("B", "reunion", proposals[1].recipe, "joy");
    const rebuiltC = proposalFromRecipe("C", "reunion", proposals[2].recipe, "joy");

    expect(rebuiltB.titleZh).toBe(proposals[1].titleZh);
    expect(rebuiltC.titleZh).toBe("团聚·喜悦合景");
    expect(rebuiltC.rationaleEn).toContain("main wish for reunion");
    expect(rebuiltC.culturalBoundaryEn).toContain("not a claim of fixed historic meaning");
  });
});
