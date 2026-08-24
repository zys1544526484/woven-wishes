import { describe, expect, it } from "vitest";
import { appReducer, initialState, type AppState } from "../src/app/state";

describe("weaving progress state", () => {
  it("cannot advance past exactly 24 rows", () => {
    let state: AppState = { ...initialState, phase: "weaving" };
    for (let row = 0; row < 30; row += 1) {
      state = appReducer(state, { type: "START_ROW", row });
      state = appReducer(state, { type: "COMMIT_ROW" });
    }
    expect(state.completedRows).toBe(24);
  });
});
