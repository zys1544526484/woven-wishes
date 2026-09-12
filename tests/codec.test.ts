import { describe, expect, it } from "vitest";
import { decodeSharePayload, encodeSharePayload } from "../src/core/codec";
import type { SharePayloadV1, SharePayloadV2, SharePayloadV3 } from "../src/core/types";

const payload: SharePayloadV1 = {
  codecVersion: 1,
  locale: "zh",
  wish: "愿远方的家人平安",
  primaryIntent: "safety",
  recipe: {
    version: 1,
    seed: 42,
    rows: 24,
    columns: 48,
    primaryMotif: "cloud",
    secondaryMotif: "roundel",
    palette: "indigo-gold",
    layout: "continuous",
  },
};

const payloadV2: SharePayloadV2 = {
  ...payload,
  codecVersion: 2,
  proposalId: "C",
  weaveMode: "duo",
};

const payloadV3: SharePayloadV3 = {
  ...payloadV2,
  codecVersion: 3,
  recipe: { ...payload.recipe, goldTreatment: "centre", borderTreatment: "balanced" },
};

describe("share fragment codec", () => {
  it("round-trips without a server", () => {
    const encoded = encodeSharePayload(payload);
    expect(decodeSharePayload(encoded)).toEqual(payload);
    expect(encoded.length).toBeLessThan(160);
  });

  it("round-trips proposal choice and collaboration mode in V2", () => {
    const encoded = encodeSharePayload(payloadV2);
    expect(decodeSharePayload(encoded)).toEqual(payloadV2);
    expect(encoded.length).toBeLessThan(180);
  });

  it("round-trips player-authored colour, gold and border decisions in V3", () => {
    const encoded = encodeSharePayload(payloadV3);
    expect(decodeSharePayload(encoded)).toEqual(payloadV3);
    expect(encoded.length).toBeLessThan(190);
  });

  it("rejects tampering", () => {
    const encoded = encodeSharePayload(payload);
    expect(() => decodeSharePayload(`x${encoded.slice(1)}`)).toThrow("Invalid checksum");
  });

  it("enforces the 1,024-byte limit", () => {
    expect(() => encodeSharePayload({ ...payload, wish: "愿".repeat(600) })).toThrow("1024");
  });
});
