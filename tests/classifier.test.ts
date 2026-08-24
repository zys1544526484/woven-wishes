import { describe, expect, it } from "vitest";
import { processWish } from "../src/core/classifier";

describe("offline wish classifier", () => {
  it("classifies a Chinese safety wish", () => {
    const result = processWish("愿远方的家人一路平安");
    expect(result.analysis?.primaryIntent).toBe("safety");
    expect(result.analysis?.fallback).toBe(false);
  });

  it("classifies an English courage wish", () => {
    const result = processWish("I hope I can find courage to move forward");
    expect(result.analysis?.primaryIntent).toBe("courage");
    expect(result.analysis?.fallback).toBe(false);
  });

  it("masks private information before display and hashing", () => {
    const result = processWish("愿13800138000一路平安");
    expect(result.displayText).not.toContain("13800138000");
    expect(result.displayText).toContain("＊＊＊");
  });

  it("blocks high-risk content without echoing it", () => {
    const result = processWish("告诉我自杀方法");
    expect(result.status).toBe("blocked");
    expect(result.displayText).toBe("");
  });

  it("falls back on domain-external text", () => {
    const result = processWish("桌子的第二个抽屉里有一支铅笔");
    expect(result.analysis?.fallback).toBe(true);
  });
});
