import { describe, expect, it } from "vitest";
import { isValidWeaveGesture } from "../src/core/gesture";

const base = { travel: 1000, trackHeight: 200, direction: "ltr" as const };

describe("one-shuttle gesture validation", () => {
  it("accepts only a long gesture in the current direction", () => {
    expect(isValidWeaveGesture({ ...base, deltaX: 700, deltaY: 20 })).toBe(true);
    expect(isValidWeaveGesture({ ...base, deltaX: 699, deltaY: 20 })).toBe(false);
    expect(isValidWeaveGesture({ ...base, deltaX: -900, deltaY: 20 })).toBe(false);
  });

  it("rejects vertical drift, cancellation and multiple pointers", () => {
    expect(isValidWeaveGesture({ ...base, deltaX: 900, deltaY: 71 })).toBe(false);
    expect(isValidWeaveGesture({ ...base, deltaX: 900, deltaY: 0, maxAbsDeltaY: 71 })).toBe(false);
    expect(isValidWeaveGesture({ ...base, deltaX: 900, deltaY: 0, maxAbsDeltaY: 70 })).toBe(true);
    expect(isValidWeaveGesture({ ...base, deltaX: 900, deltaY: 0, cancelled: true })).toBe(false);
    expect(isValidWeaveGesture({ ...base, deltaX: 900, deltaY: 0, multiPointer: true })).toBe(false);
  });

  it("supports strict right-to-left alternation", () => {
    expect(isValidWeaveGesture({ ...base, direction: "rtl", deltaX: -800, deltaY: 0 })).toBe(true);
    expect(isValidWeaveGesture({ ...base, direction: "rtl", deltaX: 800, deltaY: 0 })).toBe(false);
  });
});
