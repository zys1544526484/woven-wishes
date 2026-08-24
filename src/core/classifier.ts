import { fnv1a } from "./hash";
import {
  FEATURE_COUNT,
  MODEL_INTERCEPTS,
  MODEL_LABELS,
  MODEL_VERSION,
  MODEL_WEIGHTS_BASE64,
  MODEL_WEIGHTS_CHECKSUM,
} from "./model.generated";
import { INTENT_IDS, type IntentId, type WishAnalysis, type WishProcessingResult } from "./types";

const URL_RE = /(?:https?:\/\/|www\.)\S+/giu;
const PHONE_RE = /(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)/g;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const ID_RE = /(?<!\d)\d{17}[\dXx](?!\d)/g;
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const UNSAFE_PATTERNS = [
  /杀死|炸毁|恐怖袭击|自杀方法|仇恨所有/iu,
  /\b(?:kill|bomb|terrorist attack|suicide method|hate all)\b/iu,
];

let decodedWeights: Float32Array | null = null;

function decodeWeights(): Float32Array | null {
  if (decodedWeights) return decodedWeights;
  if (!MODEL_WEIGHTS_BASE64) return null;
  try {
    if (fnv1a(MODEL_WEIGHTS_BASE64).toString(16).padStart(8, "0") !== MODEL_WEIGHTS_CHECKSUM) return null;
    const binary = atob(MODEL_WEIGHTS_BASE64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    decodedWeights = new Float32Array(bytes.buffer);
    return decodedWeights;
  } catch {
    return null;
  }
}

export function normalizeWish(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(CONTROL_RE, "")
    .replace(URL_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function maskPrivateInformation(text: string): string {
  return text.replace(EMAIL_RE, "＊＊＊").replace(PHONE_RE, "＊＊＊").replace(ID_RE, "＊＊＊");
}

export function countGraphemes(text: string): number {
  if (typeof Intl.Segmenter === "function") {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;
  }
  return Array.from(text).length;
}

function collectFeatures(text: string): Map<number, number> {
  const normalized = text.toLocaleLowerCase();
  const characters = Array.from(normalized);
  const counts = new Map<number, number>();
  const push = (token: string) => {
    const index = fnv1a(token) % FEATURE_COUNT;
    counts.set(index, (counts.get(index) ?? 0) + 1);
  };

  for (let size = 1; size <= 3; size += 1) {
    for (let index = 0; index <= characters.length - size; index += 1) {
      push(`c${size}:${characters.slice(index, index + size).join("")}`);
    }
  }
  for (const word of normalized.match(/[a-z]+(?:'[a-z]+)?/g) ?? []) push(`w:${word}`);

  let squared = 0;
  for (const count of counts.values()) squared += count * count;
  const norm = Math.sqrt(squared) || 1;
  for (const [index, count] of counts) counts.set(index, count / norm);
  return counts;
}

function fallbackScores(text: string): Record<IntentId, number> {
  const lexicon: Record<IntentId, readonly string[]> = {
    safety: ["平安", "安全", "顺利", "守护", "健康", "safe", "peace", "protect", "well"],
    reunion: ["团聚", "团圆", "家人", "回家", "相聚", "reunion", "family", "home", "together"],
    courage: ["勇气", "坚强", "坚持", "困难", "新生", "courage", "brave", "strong", "resilience"],
    abundance: ["丰足", "丰收", "富足", "事业", "成功", "abundance", "prosper", "harvest", "success"],
    joy: ["快乐", "喜悦", "幸福", "欢喜", "笑", "joy", "happy", "delight", "smile"],
    longevity: ["长久", "长寿", "永远", "岁月", "康宁", "longevity", "lasting", "forever", "years"],
  };
  const lower = text.toLocaleLowerCase();
  const raw = Object.fromEntries(
    INTENT_IDS.map((intent) => [
      intent,
      0.2 + lexicon[intent].reduce((sum, token) => sum + (lower.includes(token) ? 1 : 0), 0),
    ]),
  ) as Record<IntentId, number>;
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0);
  for (const intent of INTENT_IDS) raw[intent] /= total;
  return raw;
}

function inferScores(text: string): Record<IntentId, number> {
  const weights = decodeWeights();
  if (!weights || weights.length !== MODEL_LABELS.length * FEATURE_COUNT) return fallbackScores(text);
  const features = collectFeatures(text);
  const logits = MODEL_LABELS.map((_, classIndex) => {
    let logit = MODEL_INTERCEPTS[classIndex] ?? 0;
    const offset = classIndex * FEATURE_COUNT;
    for (const [featureIndex, value] of features) logit += weights[offset + featureIndex] * value;
    return logit;
  });
  const maximum = Math.max(...logits);
  const exponentials = logits.map((logit) => Math.exp(logit - maximum));
  const sum = exponentials.reduce((total, value) => total + value, 0) || 1;
  return Object.fromEntries(
    MODEL_LABELS.map((label, index) => [label, exponentials[index] / sum]),
  ) as Record<IntentId, number>;
}

export function processWish(raw: string): WishProcessingResult {
  const normalized = normalizeWish(raw);
  if (!normalized) return { status: "invalid", displayText: "", reason: "empty" };
  const length = countGraphemes(normalized);
  if (length < 2) return { status: "invalid", displayText: normalized, reason: "too-short" };
  if (length > 48) return { status: "invalid", displayText: normalized, reason: "too-long" };
  if (UNSAFE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { status: "blocked", displayText: "", reason: "unsafe" };
  }

  const displayText = maskPrivateInformation(normalized);
  const scores = inferScores(displayText);
  const ranked = [...INTENT_IDS].sort((left, right) => scores[right] - scores[left]);
  const [primaryIntent, secondaryCandidate] = ranked;
  const confidence = scores[primaryIntent];
  const fallback = confidence < 0.5;
  const secondaryIntent =
    !fallback && scores[secondaryCandidate] >= 0.45 && scores[secondaryCandidate] / confidence >= 0.65
      ? secondaryCandidate
      : undefined;
  const analysis: WishAnalysis = {
    primaryIntent: fallback ? "safety" : primaryIntent,
    secondaryIntent,
    scores,
    confidence,
    fallback,
    modelVersion: MODEL_VERSION,
    seed: fnv1a(`${displayText}|pattern-rules-v1`),
  };
  return { status: fallback ? "fallback" : "ok", displayText, analysis };
}
