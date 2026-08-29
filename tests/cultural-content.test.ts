import { describe, expect, it } from "vitest";
import { MOTIFS, MOTIF_STORIES, YUNJIN_COLOR_REFERENCE } from "../src/content/motifs";
import { CRAFT_TIPS } from "../src/content/craftTips";
import { CRAFT_DISTINCTION_ZH, EXPERIENCE_DISCLAIMER_ZH } from "../src/content/project";

describe("Nanjing Yunjin cultural boundaries", () => {
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
});
