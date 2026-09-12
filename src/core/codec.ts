import { fnv1a } from "./hash";
import { INTENT_IDS, type BorderTreatmentId, type GoldTreatmentId, type IntentId, type LayoutId, type PaletteId, type PatternRecipe, type ProposalId, type SharePayload, type WeaveMode } from "./types";

const MAX_PAYLOAD_BYTES = 1024;
const PALETTES: readonly PaletteId[] = ["indigo-gold", "peacock-gold", "cinnabar-night", "jade-moon"];
const LAYOUTS: readonly LayoutId[] = ["continuous", "roundel", "scattered", "combined"];
const MOTIFS = ["cloud", "roundel", "plum", "bamboo", "fish", "peony", "magpie", "peach"] as const;
const PROPOSALS: readonly ProposalId[] = ["A", "B", "C"];
const WEAVE_MODES: readonly WeaveMode[] = ["player-weaver", "player-drawboy", "duo"];
const GOLD_TREATMENTS: readonly GoldTreatmentId[] = ["outline", "centre"];
const BORDER_TREATMENTS: readonly BorderTreatmentId[] = ["continuous", "balanced"];

type CompactPayloadV1 = [1, 0 | 1, string, number, number, number, number, number, number, number];
type CompactPayloadV2 = [2, 0 | 1, string, number, number, number, number, number, number, number, number, number];
type CompactPayloadV3 = [3, 0 | 1, string, number, number, number, number, number, number, number, number, number, number, number];

function compactPayload(payload: SharePayload): CompactPayloadV1 | CompactPayloadV2 | CompactPayloadV3 {
  const common = [
    payload.locale === "zh" ? 0 : 1,
    payload.wish,
    INTENT_IDS.indexOf(payload.primaryIntent),
    payload.secondaryIntent ? INTENT_IDS.indexOf(payload.secondaryIntent) + 1 : 0,
    payload.recipe.seed,
    MOTIFS.indexOf(payload.recipe.primaryMotif as (typeof MOTIFS)[number]),
    payload.recipe.secondaryMotif ? MOTIFS.indexOf(payload.recipe.secondaryMotif as (typeof MOTIFS)[number]) + 1 : 0,
    PALETTES.indexOf(payload.recipe.palette),
    LAYOUTS.indexOf(payload.recipe.layout),
  ] as const;
  if (payload.codecVersion === 1) return [1, ...common];
  const authored = [PROPOSALS.indexOf(payload.proposalId), WEAVE_MODES.indexOf(payload.weaveMode)] as const;
  if (payload.codecVersion === 2) return [2, ...common, ...authored];
  return [3, ...common, ...authored, GOLD_TREATMENTS.indexOf(payload.recipe.goldTreatment), BORDER_TREATMENTS.indexOf(payload.recipe.borderTreatment)];
}

function expandPayload(value: unknown): unknown {
  if (!Array.isArray(value) || (value[0] !== 1 && value[0] !== 2 && value[0] !== 3)) return value;
  if ((value[0] === 1 && value.length !== 10) || (value[0] === 2 && value.length !== 12) || (value[0] === 3 && value.length !== 14)) return value;
  const [codecVersion, localeCode, wish, primaryIndex, secondaryCode, seed, motifIndex, secondaryMotifCode, paletteIndex, layoutIndex, proposalIndex, weaveModeIndex, goldIndex, borderIndex] = value;
  const common = {
    codecVersion,
    locale: localeCode === 0 ? "zh" : localeCode === 1 ? "en" : undefined,
    wish,
    primaryIntent: INTENT_IDS[primaryIndex],
    secondaryIntent: secondaryCode ? INTENT_IDS[secondaryCode - 1] : undefined,
    recipe: {
      version: 1,
      seed,
      rows: 24,
      columns: 48,
      primaryMotif: MOTIFS[motifIndex],
      secondaryMotif: secondaryMotifCode ? MOTIFS[secondaryMotifCode - 1] : undefined,
      palette: PALETTES[paletteIndex],
      layout: LAYOUTS[layoutIndex],
    },
  };
  if (codecVersion === 1) return common;
  const authored = { ...common, proposalId: PROPOSALS[proposalIndex], weaveMode: WEAVE_MODES[weaveModeIndex] };
  if (codecVersion === 2) return authored;
  return {
    ...authored,
    recipe: { ...common.recipe, goldTreatment: GOLD_TREATMENTS[goldIndex], borderTreatment: BORDER_TREATMENTS[borderIndex] },
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function isSharePayload(value: unknown): value is SharePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as {
    codecVersion?: unknown;
    wish?: unknown;
    locale?: unknown;
    primaryIntent?: unknown;
    secondaryIntent?: unknown;
    recipe?: Partial<PatternRecipe>;
    proposalId?: unknown;
    weaveMode?: unknown;
  };
  const commonIsValid = (payload.codecVersion === 1 || payload.codecVersion === 2 || payload.codecVersion === 3)
    && typeof payload.wish === "string"
    && Array.from(payload.wish).length >= 2
    && Array.from(payload.wish).length <= 48
    && (payload.locale === "zh" || payload.locale === "en")
    && INTENT_IDS.includes(payload.primaryIntent as IntentId)
    && (payload.secondaryIntent === undefined || INTENT_IDS.includes(payload.secondaryIntent as IntentId))
    && payload.recipe?.version === 1
    && payload.recipe.rows === 24
    && payload.recipe.columns === 48
    && Number.isSafeInteger(payload.recipe.seed)
    && (payload.recipe.seed as number) >= 0
    && (payload.recipe.seed as number) <= 0xffffffff
    && MOTIFS.includes(payload.recipe.primaryMotif as (typeof MOTIFS)[number])
    && (payload.recipe.secondaryMotif === undefined || MOTIFS.includes(payload.recipe.secondaryMotif as (typeof MOTIFS)[number]))
    && PALETTES.includes(payload.recipe.palette as PaletteId)
    && LAYOUTS.includes(payload.recipe.layout as LayoutId);
  if (!commonIsValid) return false;
  if (payload.codecVersion === 1) return true;
  const authoredIsValid = PROPOSALS.includes(payload.proposalId as ProposalId)
    && WEAVE_MODES.includes(payload.weaveMode as WeaveMode);
  if (!authoredIsValid || payload.codecVersion === 2) return authoredIsValid;
  return GOLD_TREATMENTS.includes(payload.recipe?.goldTreatment as GoldTreatmentId)
    && BORDER_TREATMENTS.includes(payload.recipe?.borderTreatment as BorderTreatmentId);
}

export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(compactPayload(payload));
  const bytes = new TextEncoder().encode(json);
  if (bytes.byteLength > MAX_PAYLOAD_BYTES) throw new Error("Share payload exceeds 1024 bytes");
  const encoded = bytesToBase64Url(bytes);
  const checksum = fnv1a(encoded).toString(16).padStart(8, "0");
  return `${encoded}.${checksum}`;
}

export function decodeSharePayload(encoded: string): SharePayload {
  const separator = encoded.lastIndexOf(".");
  if (separator < 1) throw new Error("Missing checksum");
  const body = encoded.slice(0, separator);
  const checksum = encoded.slice(separator + 1);
  if (fnv1a(body).toString(16).padStart(8, "0") !== checksum) throw new Error("Invalid checksum");
  const bytes = base64UrlToBytes(body);
  if (bytes.byteLength > MAX_PAYLOAD_BYTES) throw new Error("Payload too large");
  const value = expandPayload(JSON.parse(new TextDecoder().decode(bytes)) as unknown);
  if (!isSharePayload(value)) throw new Error("Unsupported payload");
  return value;
}

export function buildShareUrl(payload: SharePayload, configuredBase?: string): string {
  const current = new URL(globalThis.location?.href ?? "https://localhost/");
  const base = configuredBase?.trim()
    ? new URL(configuredBase)
    : new URL("share.html", current);
  base.hash = `r=${encodeSharePayload(payload)}`;
  return base.toString();
}

export function payloadFromLocationHash(hash: string): SharePayload {
  const match = hash.match(/^#?r=(.+)$/);
  if (!match) throw new Error("Missing result payload");
  return decodeSharePayload(match[1]);
}
