import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MOTIFS, MOTIF_STORIES, YUNJIN_COLOR_REFERENCE } from "../src/content/motifs";
import { CRAFT_TIPS, getWeaveStageTip, WEAVE_STAGE_TIPS } from "../src/content/craftTips";
import { gestureFeedbackCopy } from "../src/app/WeavingScreen";
import { CRAFT_DISTINCTION_ZH, EXPERIENCE_DISCLAIMER_ZH } from "../src/content/project";

describe("Nanjing Yunjin cultural boundaries", () => {
  it("resolves every motif and tip reference to the cultural ledger", () => {
    const ledger = readFileSync(new URL("../docs/CULTURAL_BASIS.md", import.meta.url), "utf8");
    for (const item of [...Object.values(MOTIFS), ...CRAFT_TIPS, ...WEAVE_STAGE_TIPS]) {
      for (const reference of item.sourceRefs) expect(ledger).toContain(`| ${reference} |`);
    }
  });
  it("identifies the exact craft focus instead of generic brocade", () => {
    expect(EXPERIENCE_DISCLAIMER_ZH).toContain("南京云锦木机妆花");
    expect(CRAFT_DISTINCTION_ZH).toContain("拽花工");
    expect(CRAFT_DISTINCTION_ZH).toContain("经纬交织");
    expect(CRAFT_DISTINCTION_ZH).toContain("不代表其他织锦");
  });

  it("uses sourced roundel terminology and marks every semantic link as contemporary", () => {
    expect(MOTIFS.roundel.nameZh).toBe("团花构图");
    Object.values(MOTIF_STORIES).forEach((story) => {
      expect(story.cultureZh).toMatch(/本作|重新组合|抽象重绘/);
    });
  });

  it("offers six short, source-traceable Yunjin tips after completion", () => {
    expect(CRAFT_TIPS).toHaveLength(6);
    CRAFT_TIPS.forEach((tip) => {
      expect(Array.from(tip.bodyZh).length).toBeGreaterThan(20);
      expect(Array.from(tip.bodyZh).length).toBeLessThan(110);
      expect(tip.sourceRefs.length).toBeGreaterThan(0);
    });
  });

  it("keeps the documented six colour families separate from digital approximations", () => {
    expect(YUNJIN_COLOR_REFERENCE.map((entry) => entry.familyZh)).toEqual([
      "黄色系", "红色系", "蓝色系", "绿色系", "紫色系", "棕色系",
    ]);
    YUNJIN_COLOR_REFERENCE.forEach((entry) => expect(entry.color).toMatch(/^#[0-9A-F]{6}$/));
  });

  it("changes a source-traceable, action-linked tip after every six passes", () => {
    expect(WEAVE_STAGE_TIPS.map((tip) => tip.id)).toEqual(["ground", "colour", "gold", "border"]);
    expect([0, 5, 6, 11, 12, 17, 18, 23].map((row) => getWeaveStageTip(row).id)).toEqual([
      "ground", "ground", "colour", "colour", "gold", "gold", "border", "border",
    ]);
    WEAVE_STAGE_TIPS.forEach((tip) => {
      expect(tip.sourceRefs.length).toBeGreaterThan(0);
      expect(tip.bodyZh).toMatch(/这里|本作|屏幕|这二十四梭/);
      expect(tip.bodyEn).not.toMatch(/[\u3400-\u9fff]/u);
    });
  });

  it("gives specific, single-language guidance for short and reversed gestures", () => {
    expect(gestureFeedbackCopy("zh", "short", "ltr")).toContain("另一端");
    expect(gestureFeedbackCopy("zh", "direction", "rtl")).toContain("向左");
    expect(gestureFeedbackCopy("en", "short", "ltr")).not.toMatch(/[\u3400-\u9fff]/u);
    expect(gestureFeedbackCopy("en", "direction", "rtl")).toContain("left");
  });
});
