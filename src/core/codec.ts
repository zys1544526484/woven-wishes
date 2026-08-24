import { fnv1a } from "./hash";
import { INTENT_IDS, type LayoutId, type PaletteId, type SharePayloadV1 } from "./types";

const MAX_PAYLOAD_BYTES = 1024;
const PALETTES: readonly PaletteId[] = ["indigo-gold", "peacock-gold", "cinnabar-night", "jade-moon"];
const LAYOUTS: readonly LayoutId[] = ["continuous", "roundel", "scattered", "combined"];
const MOTIFS = ["cloud", "roundel", "plum", "bamboo", "fish", "peony", "magpie", "peach"] as const;

type CompactPayloadV1 = [1, 0 | 1, string, number, number, number, number, number, number, number];

function compactPayload(payload: SharePayloadV1): CompactPayloadV1 {
  return [
    1,
    payload.locale === "zh" ? 0 : 1,
    payload.wish,
    INTENT_IDS.indexOf(payload.primaryIntent),
    payload.secondaryIntent ? INTENT_IDS.indexOf(payload.secondaryIntent) + 1 : 0,
    payload.recipe.seed,
    MOTIFS.indexOf(payload.recipe.primaryMotif as (typeof MOTIFS)[number]),
    payload.recipe.secondaryMotif ? MOTIFS.indexOf(payload.recipe.secondaryMotif as (typeof MOTIFS)[number]) + 1 : 0,
    PALETTES.indexOf(payload.recipe.palette),
    LAYOUTS.indexOf(payload.recipe.layout),
  ];
}

function expandPayload(value: unknown): unknown {
  if (!Array.isArray(value) || value.length !== 10 || value[0] !== 1) return value;
  const [codecVersion, localeCode, wish, primaryIndex, secondaryCode, seed, motifIndex, secondaryMotifCode, paletteIndex, layoutIndex] = value;
  return {
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

function isSharePayload(value: unknown): value is SharePayloadV1 {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<SharePayloadV1>;
  return payload.codecVersion === 1
    && typeof payload.wish === "string"
    && Array.from(payload.wish).length >= 2
    && Array.from(payload.wish).length <= 48
    && (payload.locale === "zh" || payload.locale === "en")
    && INTENT_IDS.includes(payload.primaryIntent as (typeof INTENT_IDS)[number])
    && (payload.secondaryIntent === undefined || INTENT_IDS.includes(payload.secondaryIntent))
    && payload.recipe?.version === 1
    && payload.recipe.rows === 24
    && payload.recipe.columns === 48
    && Number.isSafeInteger(payload.recipe.seed)
    && payload.recipe.seed >= 0
    && payload.recipe.seed <= 0xffffffff
    && MOTIFS.includes(payload.recipe.primaryMotif as (typeof MOTIFS)[number])
    && (payload.recipe.secondaryMotif === undefined || MOTIFS.includes(payload.recipe.secondaryMotif as (typeof MOTIFS)[number]))
    && PALETTES.includes(payload.recipe.palette)
    && LAYOUTS.includes(payload.recipe.layout);
}

export function encodeSharePayload(payload: SharePayloadV1): string {
  const json = JSON.stringify(compactPayload(payload));
  const bytes = new TextEncoder().encode(json);
  if (bytes.byteLength > MAX_PAYLOAD_BYTES) throw new Error("Share payload exceeds 1024 bytes");
  const encoded = bytesToBase64Url(bytes);
  const checksum = fnv1a(encoded).toString(16).padStart(8, "0");
  return `${encoded}.${checksum}`;
}

export function decodeSharePayload(encoded: string): SharePayloadV1 {
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

export function buildShareUrl(payload: SharePayloadV1, configuredBase?: string): string {
  const current = new URL(globalThis.location?.href ?? "https://localhost/");
  const base = configuredBase?.trim()
    ? new URL(configuredBase)
    : new URL("share.html", current);
  base.hash = `r=${encodeSharePayload(payload)}`;
  return base.toString();
}

export function payloadFromLocationHash(hash: string): SharePayloadV1 {
  const match = hash.match(/^#?r=(.+)$/);
  if (!match) throw new Error("Missing result payload");
  return decodeSharePayload(match[1]);
}
