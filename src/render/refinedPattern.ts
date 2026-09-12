import motifAtlasUrl from "../assets/motif-atlas-v1.3.png";
import { seededRandom } from "../core/hash";
import type { Palette, PatternRecipe, WeaveStageId } from "../core/types";

interface AtlasRegion { x: number; y: number; width: number; height: number }

export const MOTIF_ATLAS_REGIONS: Record<string, AtlasRegion> = {
  cloud: { x: 18, y: 31, width: 397, height: 400 },
  roundel: { x: 431, y: 31, width: 397, height: 400 },
  bamboo: { x: 844, y: 31, width: 397, height: 400 },
  plum: { x: 1256, y: 31, width: 398, height: 400 },
  fish: { x: 18, y: 472, width: 397, height: 399 },
  peony: { x: 431, y: 472, width: 397, height: 399 },
  magpie: { x: 844, y: 472, width: 397, height: 399 },
  peach: { x: 1256, y: 472, width: 398, height: 399 },
};

type ThreadLayerId = "colour" | "gold";

export interface RefinedStageState {
  completedRows: number;
  activeStage: WeaveStageId;
  ground: number;
  colour: number;
  gold: number;
  border: number;
}

/** Normalised, square motif placement used by the actual high-density painter. */
export interface RefinedMotifPlacement {
  motifId: string;
  centerX: number;
  centerY: number;
  size: number;
  mirror: boolean;
  opacity: number;
  revealSeed: number;
}

export interface RefinedPatternPlan {
  layout: PatternRecipe["layout"];
  goldTreatment: NonNullable<PatternRecipe["goldTreatment"]>;
  borderVariant: number;
  borderStartSegment: number;
  groundPhase: number;
  placements: RefinedMotifPlacement[];
}

let atlasPromise: Promise<HTMLImageElement> | undefined;
const tintedMotifs = new Map<string, HTMLCanvasElement>();
const REFINED_RENDER_VERSION = 4;

export function loadMotifAtlas(): Promise<HTMLImageElement> {
  if (!atlasPromise) {
    atlasPromise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to load refined motif atlas"));
      image.src = motifAtlasUrl;
    });
  }
  return atlasPromise;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function getRefinedStageState(completedRows: number, totalRows = 24): RefinedStageState {
  const safeTotal = Math.max(4, totalRows);
  const rows = clamp(completedRows, 0, safeTotal);
  const section = safeTotal / 4;
  const phase = (start: number) => clamp01((rows - start) / section);
  const activeStage: WeaveStageId = rows <= section
    ? "ground"
    : rows <= section * 2
      ? "colour"
      : rows <= section * 3
        ? "gold"
        : "border";
  return {
    completedRows: rows,
    activeStage,
    ground: phase(0),
    colour: phase(section),
    gold: phase(section * 2),
    border: phase(section * 3),
  };
}

function placement(
  motifId: string,
  centerX: number,
  centerY: number,
  size: number,
  mirror: boolean,
  opacity: number,
  seed: number,
  index: number,
): RefinedMotifPlacement {
  return {
    motifId,
    centerX: clamp(centerX, 0.08, 0.92),
    centerY: clamp(centerY, 0.08, 0.92),
    size: clamp(size, 0.18, 0.96),
    mirror,
    opacity,
    revealSeed: (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0,
  };
}

/**
 * Turns the recipe into the composition instructions consumed by paintRefinedPattern.
 * It is deliberately pure so previews, result cards and tests share one deterministic plan.
 */
export function createRefinedPatternPlan(recipe: PatternRecipe): RefinedPatternPlan {
  const random = seededRandom((recipe.seed ^ 0x73e2d41b) >>> 0);
  const scale = 0.94 + random() * 0.11;
  const driftX = (random() - 0.5) * 0.055;
  const driftY = (random() - 0.5) * 0.045;
  const mirror = random() >= 0.5;
  const secondary = recipe.secondaryMotif ?? recipe.primaryMotif;
  const placements: RefinedMotifPlacement[] = [];
  const add = (motifId: string, centerX: number, centerY: number, size: number, reflected: boolean, opacity = 1) => {
    placements.push(placement(motifId, centerX, centerY, size, reflected, opacity, recipe.seed, placements.length));
  };

  if (recipe.secondaryMotif && recipe.layout === "roundel") {
    add(recipe.primaryMotif, 0.36 + driftX * 0.3, 0.48, 0.59 * scale, mirror);
    add(secondary, 0.78, 0.59 + driftY, 0.34 * scale, !mirror);
  } else if (recipe.layout === "roundel") {
    add(recipe.primaryMotif, 0.5 + driftX * 0.35, 0.5 + driftY * 0.3, 0.9 * scale, mirror);
    if (recipe.secondaryMotif) {
      add(secondary, 0.82 - driftX, 0.23 + driftY, 0.25 * scale, !mirror, 0.82);
      add(secondary, 0.18 + driftX, 0.77 - driftY, 0.21 * scale, mirror, 0.68);
    }
  } else if (recipe.layout === "continuous") {
    add(recipe.primaryMotif, 0.26 + driftX * 0.3, 0.48 + driftY, 0.44 * scale, mirror);
    add(secondary, 0.74 - driftX * 0.3, 0.52 - driftY, 0.44 * (1.98 - scale), !mirror);
  } else if (recipe.layout === "scattered") {
    add(recipe.primaryMotif, 0.32 + driftX * 0.3, 0.43, 0.54 * scale, mirror);
    add(secondary, 0.77, 0.7 - driftY, 0.33 * scale, !mirror);
    add(recipe.primaryMotif, 0.78, 0.23, 0.23 * scale, !mirror, 0.92);
  } else {
    add(recipe.primaryMotif, 0.31 + driftX * 0.3, 0.4, 0.53 * scale, mirror);
    add(secondary, 0.75, 0.64 + driftY, 0.4 * (1.98 - scale), !mirror);
  }

  const randomBorder = Math.floor(random() * 12);
  const borderVariant = recipe.borderTreatment === "continuous"
    ? Math.floor(randomBorder / 3) * 3
    : recipe.borderTreatment === "balanced"
      ? Math.floor(randomBorder / 3) * 3 + 1
      : randomBorder;
  return {
    layout: recipe.layout,
    goldTreatment: recipe.goldTreatment ?? "outline",
    borderVariant,
    borderStartSegment: Math.floor(random() * 6),
    groundPhase: Math.floor(random() * 6),
    placements,
  };
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** A signature of the same plan and four layer progresses used for canvas drawing. */
export function refinedPatternSignature(recipe: PatternRecipe, completedRows: number = recipe.rows): string {
  const plan = createRefinedPatternPlan(recipe);
  const stage = getRefinedStageState(completedRows, recipe.rows);
  const placementTokens = plan.placements.map((item) => [
    item.motifId,
    item.centerX.toFixed(4),
    item.centerY.toFixed(4),
    item.size.toFixed(4),
    item.mirror ? 1 : 0,
    item.opacity.toFixed(3),
    item.revealSeed,
  ].join(",")).join(";");
  return fnv1a([
    REFINED_RENDER_VERSION,
    recipe.palette,
    plan.layout,
    plan.goldTreatment,
    recipe.borderTreatment ?? "seeded",
    plan.borderVariant,
    plan.borderStartSegment,
    plan.groundPhase,
    placementTokens,
    stage.ground.toFixed(3),
    stage.colour.toFixed(3),
    stage.gold.toFixed(3),
    stage.border.toFixed(3),
  ].join("|"));
}

function parseHex(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function liftThreadColor(color: [number, number, number], amount: number): [number, number, number] {
  return color.map((channel) => Math.round(channel + (255 - channel) * amount)) as [number, number, number];
}

function tintedMotif(atlas: HTMLImageElement, motifId: string, palette: Palette, layer: ThreadLayerId): HTMLCanvasElement {
  const region = MOTIF_ATLAS_REGIONS[motifId] ?? MOTIF_ATLAS_REGIONS.cloud;
  const cacheKey = `${REFINED_RENDER_VERSION}:${motifId}:${palette.id}:${palette.colors.join("")}:${layer}`;
  const cached = tintedMotifs.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = region.width;
  canvas.height = region.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;
  context.drawImage(atlas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
  const imageData = context.getImageData(0, 0, region.width, region.height);
  const gold = liftThreadColor(parseHex(palette.colors[1]), 0.035);
  const teal = liftThreadColor(parseHex(palette.colors[2]), 0.2);
  const accent = liftThreadColor(parseHex(palette.colors[3]), 0.18);

  for (let index = 0; index < imageData.data.length; index += 4) {
    const red = imageData.data[index];
    const green = imageData.data[index + 1];
    const blue = imageData.data[index + 2];
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const chroma = maximum - minimum;
    const pixelIndex = index / 4;
    const pixelX = pixelIndex % region.width;
    const pixelY = Math.floor(pixelIndex / region.width);
    const normalizedX = pixelX / region.width;
    const normalizedY = pixelY / region.height;
    const atlasCorner = (normalizedX < 0.17 || normalizedX > 0.83)
      && (normalizedY < 0.17 || normalizedY > 0.83);
    if (maximum < 42 || chroma < 9 || atlasCorner) {
      imageData.data[index + 3] = 0;
      continue;
    }
    const goldThread = red > blue * 1.24 && green > blue * 1.12;
    if ((layer === "gold") !== goldThread) {
      imageData.data[index + 3] = 0;
      continue;
    }
    // Contemporary colour zoning follows broad motif areas, never individual random pixels.
    const blend = clamp01((normalizedY - 0.46) / 0.3);
    const target = goldThread ? gold : teal.map((channel, i) =>
      channel * (1 - blend) + accent[i] * blend);
    const luminanceStrength = clamp01((maximum - 40) / 168);
    const colourStrength = clamp01((chroma - 7) / 92);
    const threadStrength = clamp01(luminanceStrength * (0.62 + colourStrength * 0.38));
    if (threadStrength < 0.055) {
      imageData.data[index + 3] = 0;
      continue;
    }
    const brightness = layer === "gold"
      ? 0.8 + threadStrength * 0.4
      : 0.8 + threadStrength * 0.45;
    const edgeFade = clamp01(threadStrength / 0.18);
    const opacity = layer === "gold"
      ? (0.38 + Math.pow(threadStrength, 0.78) * 0.62) * edgeFade
      : (0.4 + Math.pow(threadStrength, 0.82) * 0.6) * edgeFade;
    imageData.data[index] = Math.min(255, target[0] * brightness);
    imageData.data[index + 1] = Math.min(255, target[1] * brightness);
    imageData.data[index + 2] = Math.min(255, target[2] * brightness);
    imageData.data[index + 3] = Math.round(255 * opacity);
  }
  context.clearRect(0, 0, region.width, region.height);
  context.putImageData(imageData, 0, 0);
  // Resample the shape once, then shade fine horizontal floats and dark warp crossings.
  // This is a digital material treatment, not a historical weave structure.
  const textile = document.createElement("canvas");
  const resolution = 768;
  textile.width = textile.height = resolution;
  const textileContext = textile.getContext("2d", { willReadFrequently: true });
  if (!textileContext) return canvas;
  textileContext.imageSmoothingQuality = "high";
  textileContext.drawImage(canvas, 0, 0, resolution, resolution);
  const threads = textileContext.getImageData(0, 0, resolution, resolution);
  const lightAcross = Array.from({ length: resolution }, (_, x) => 0.94 + 0.06 * Math.cos(x / 94));
  for (let y = 0; y < resolution; y++) {
    const row = Math.floor(y / 3);
    const ridge = [0.78, 1.24, 1.02][y % 3];
    for (let x = 0; x < resolution; x++) {
      const i = (y * resolution + x) * 4;
      if (!threads.data[i + 3]) continue;
      const crossing = (x + row * 3) % 12 < 2;
      const light = ridge * (crossing ? 0.62 : 1)
        * lightAcross[x];
      for (let channel = 0; channel < 3; channel++) {
        threads.data[i + channel] *= light;
      }
      threads.data[i + 3] *= crossing ? 0.66 : 1;
    }
  }
  textileContext.putImageData(threads, 0, 0);
  // Bound the derived cache for long-running exhibitions.
  if (tintedMotifs.size >= 12) tintedMotifs.delete(tintedMotifs.keys().next().value!);
  tintedMotifs.set(cacheKey, textile);
  return textile;
}

function roundedRectPath(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawWarpGround(
  context: CanvasRenderingContext2D,
  palette: Palette,
  width: number,
  height: number,
  progress: number,
  phase: number,
): void {
  context.fillStyle = palette.colors[0];
  context.fillRect(0, 0, width, height);
  const glow = context.createRadialGradient(width * 0.5, height * 0.44, 0, width * 0.5, height * 0.44, Math.max(width, height) * 0.65);
  glow.addColorStop(0, `${palette.colors[2]}30`);
  glow.addColorStop(0.52, `${palette.colors[0]}00`);
  glow.addColorStop(1, "rgba(0,0,0,.34)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  const warpStep = Math.max(4, width / 150);
  const fineWarpStep = Math.max(2.4, width / 420);
  context.lineWidth = Math.max(0.4, width / 3200);
  for (let x = 0, index = 0; x <= width; x += fineWarpStep, index += 1) {
    context.strokeStyle = index % 6 === phase % 6 ? `${palette.colors[1]}12` : `${palette.colors[2]}18`;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  context.lineWidth = Math.max(0.45, width / 2700);
  for (let x = 0, index = 0; x <= width; x += warpStep, index += 1) {
    context.strokeStyle = index % 4 === phase % 4 ? `${palette.colors[1]}13` : `${palette.colors[2]}1d`;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  const revealedGroups = Math.round(clamp01(progress) * 6);
  const weftStep = Math.max(2.4, height / 240);
  for (let y = weftStep, index = 0; y < height; y += weftStep, index += 1) {
    const group = (index * 5 + phase) % 6;
    if (group >= revealedGroups) continue;
    const highlighted = (index + phase) % 5 === 0;
    context.strokeStyle = highlighted ? `${palette.colors[1]}18` : `${palette.colors[2]}1f`;
    context.lineWidth = highlighted ? Math.max(0.55, height / 1450) : Math.max(0.38, height / 1900);
    context.setLineDash([Math.max(1.2, width / 760), Math.max(1.8, width / 610)]);
    context.lineDashOffset = ((index * 13 + phase * 7) % 31) * -1;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.setLineDash([]);
  context.lineDashOffset = 0;
}

function drawThreadBorder(context: CanvasRenderingContext2D, palette: Palette, width: number, height: number, variant: number): void {
  const outer = Math.max(10, Math.min(width, height) * 0.026);
  const inner = outer + Math.max(8, Math.min(width, height) * 0.018);
  const radius = Math.max(10, Math.min(width, height) * 0.025);
  context.save();
  context.shadowColor = `${palette.colors[1]}4a`;
  context.shadowBlur = Math.max(3, width * 0.0035);
  context.strokeStyle = palette.colors[1];
  context.lineWidth = Math.max(1.4, width / 540);
  roundedRectPath(context, outer, outer, width - outer * 2, height - outer * 2, radius);
  context.stroke();
  context.shadowBlur = 0;
  context.strokeStyle = palette.colors[2];
  context.lineWidth = Math.max(1, width / 900);
  roundedRectPath(context, inner, inner, width - inner * 2, height - inner * 2, radius * 0.72);
  context.stroke();

  const railGap = Math.max(3, Math.min(width, height) * 0.007);
  context.strokeStyle = `${palette.colors[1]}c8`;
  context.lineWidth = Math.max(0.65, width / 1500);
  roundedRectPath(context, outer + railGap, outer + railGap, width - (outer + railGap) * 2, height - (outer + railGap) * 2, radius * 0.86);
  context.stroke();
  context.strokeStyle = `${palette.colors[2]}a8`;
  roundedRectPath(context, inner + railGap, inner + railGap, width - (inner + railGap) * 2, height - (inner + railGap) * 2, radius * 0.6);
  context.stroke();

  const horizontalStart = inner + radius;
  const horizontalEnd = width - inner - radius;
  const step = Math.max(13, width / (31 + variant % 5));
  const amplitude = Math.max(4, height * (0.009 + (variant % 3) * 0.0015));
  for (const edgeY of [inner + amplitude * 1.7, height - inner - amplitude * 1.7]) {
    for (const [offset, colour] of [[-amplitude * 0.22, palette.colors[1]], [amplitude * 0.22, palette.colors[2]]] as const) {
      context.beginPath();
      for (let x = horizontalStart; x <= horizontalEnd; x += 1.5) {
        const phase = ((x - horizontalStart) / step) * Math.PI * 2;
        const waveform = variant % 3 === 0
          ? Math.sin(phase)
          : variant % 3 === 1
            ? Math.sin(phase) * Math.cos(phase * 0.5)
            : Math.sin(phase) * 0.72 + Math.sin(phase * 2) * 0.28;
        const y = edgeY + waveform * amplitude + offset;
        if (x === horizontalStart) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = colour;
      context.lineWidth = Math.max(0.7, width / 1450);
      context.setLineDash([Math.max(0.9, width / 1250), Math.max(1.5, width / (560 + variant * 8))]);
      context.lineDashOffset = -(variant % 6) * Math.max(1, width / 850);
      context.stroke();
    }
  }
  context.setLineDash([]);
  context.lineDashOffset = 0;

  const verticalStep = Math.max(15, height / (18 + variant % 4));
  for (const edgeX of [inner + amplitude * 1.6, width - inner - amplitude * 1.6]) {
    for (let y = inner + radius, index = 0; y < height - inner - radius; y += verticalStep, index += 1) {
      context.strokeStyle = (index + variant) % 2 ? palette.colors[1] : palette.colors[2];
      context.lineWidth = Math.max(1, width / 980);
      context.beginPath();
      if (variant % 2 === 0) {
        context.ellipse(edgeX, y, amplitude * 0.68, amplitude, 0, 0, Math.PI * 2);
      } else {
        context.moveTo(edgeX, y - amplitude);
        context.lineTo(edgeX + amplitude * 0.7, y);
        context.lineTo(edgeX, y + amplitude);
        context.lineTo(edgeX - amplitude * 0.7, y);
        context.closePath();
      }
      context.stroke();
    }
  }

  const cornerSize = Math.max(7, Math.min(width, height) * 0.017);
  for (const [cornerX, cornerY] of [[inner, inner], [width - inner, inner], [width - inner, height - inner], [inner, height - inner]]) {
    context.save();
    context.translate(cornerX, cornerY);
    context.rotate((variant % 4) * Math.PI / 4);
    context.strokeStyle = variant % 2 ? palette.colors[2] : palette.colors[1];
    context.beginPath();
    context.moveTo(0, -cornerSize);
    context.lineTo(cornerSize, 0);
    context.lineTo(0, cornerSize);
    context.lineTo(-cornerSize, 0);
    context.closePath();
    context.stroke();
    context.restore();
  }
  context.restore();
}

function revealOrder(seed: number, count: number): number[] {
  const values = Array.from({ length: count }, (_, index) => index);
  const random = seededRandom((seed ^ 0x4f1bbcdc) >>> 0);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function clipMotifReveal(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number,
  seed: number,
): void {
  if (progress >= 1) return;
  const columns = 1;
  const rows = 48;
  const tileCount = columns * rows;
  const visibleTiles = Math.max(1, Math.ceil(clamp01(progress) * tileCount));
  const order = revealOrder(seed, tileCount);
  const tileWidth = width / columns;
  const tileHeight = height / rows;
  context.beginPath();
  for (const tile of order.slice(0, visibleTiles)) {
    const column = tile % columns;
    const row = Math.floor(tile / columns);
    context.rect(x + column * tileWidth - 1, y + row * tileHeight - 1, tileWidth + 2, tileHeight + 2);
  }
  context.clip();
}

function drawMotifLayer(
  context: CanvasRenderingContext2D,
  motif: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { alpha: number; mirror: boolean; reveal: number; revealSeed: number; layer: ThreadLayerId },
): void {
  const insetX = motif.width * 0.095;
  const insetY = motif.height * 0.095;
  context.save();
  clipMotifReveal(context, x, y, width, height, options.reveal, options.revealSeed);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.globalAlpha *= options.alpha * (0.78 + options.reveal * 0.22);
  context.globalCompositeOperation = "source-over";
  context.filter = options.layer === "gold"
    ? "brightness(1.03) contrast(1.16) saturate(1.02)"
    : "brightness(1.07) contrast(1.14) saturate(1.12)";
  context.shadowColor = options.layer === "gold" ? "rgba(227,179,79,.17)" : "rgba(42,126,130,.08)";
  context.shadowBlur = 0;
  const drawLayer = () => {
    if (options.mirror) {
      context.drawImage(motif, insetX, insetY, motif.width - insetX * 2, motif.height - insetY * 2, 0, 0, width, height);
    } else {
      context.drawImage(motif, insetX, insetY, motif.width - insetX * 2, motif.height - insetY * 2, x, y, width, height);
    }
  };
  if (options.mirror) {
    context.translate(x + width, y);
    context.scale(-1, 1);
  }
  drawLayer();
  context.restore();
}

function drawCompositionConnectors(
  context: CanvasRenderingContext2D,
  plan: RefinedPatternPlan,
  palette: Palette,
  width: number,
  height: number,
  layer: ThreadLayerId,
  progress: number,
): void {
  if (progress <= 0 || plan.placements.length === 0) return;
  const color = layer === "gold" ? palette.colors[1] : palette.colors[2];
  const first = plan.placements[0];
  const second = plan.placements[1] ?? first;
  context.save();
  context.globalAlpha *= (layer === "gold" ? 0.52 : 0.38) * progress;
  context.strokeStyle = color;
  context.lineWidth = Math.max(0.8, width / (layer === "gold" ? 1050 : 1350));
  context.setLineDash(layer === "gold" ? [Math.max(2, width / 430), Math.max(4, width / 230)] : [Math.max(1, width / 700), Math.max(3, width / 310)]);
  context.lineDashOffset = -plan.borderVariant * 2;
  context.beginPath();
  if (plan.layout === "roundel") {
    const radius = first.size * Math.min(width, height) * 0.43;
    context.ellipse(first.centerX * width, first.centerY * height, radius, radius * 0.91, 0, 0, Math.PI * 2);
  } else if (plan.layout === "continuous") {
    context.moveTo(width * 0.05, height * 0.5);
    context.bezierCurveTo(width * 0.28, height * 0.3, width * 0.7, height * 0.7, width * 0.95, height * 0.5);
  } else if (plan.layout === "scattered") {
    context.moveTo(first.centerX * width, first.centerY * height);
    context.quadraticCurveTo(width * 0.56, height * 0.24, second.centerX * width, second.centerY * height);
  } else {
    context.moveTo(first.centerX * width, first.centerY * height);
    context.bezierCurveTo(width * 0.5, height * 0.28, width * 0.57, height * 0.74, second.centerX * width, second.centerY * height);
  }
  context.stroke();
  context.restore();
}

function drawMotifComposition(
  context: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  plan: RefinedPatternPlan,
  palette: Palette,
  width: number,
  height: number,
  layer: ThreadLayerId,
  progress: number,
): void {
  if (progress <= 0) return;
  if (layer !== "gold" || plan.goldTreatment === "outline") {
    drawCompositionConnectors(context, plan, palette, width, height, layer, progress);
  }
  const shortSide = Math.min(width, height);
  const layerSalt = layer === "gold" ? 0xa511e9b3 : 0x3c6ef372;
  for (const item of plan.placements) {
    const size = item.size * shortSide;
    const x = item.centerX * width - size / 2;
    const y = item.centerY * height - size / 2;
    const motif = tintedMotif(atlas, item.motifId, palette, layer);
    const draw = (alpha: number): void => drawMotifLayer(context, motif, x, y, size, size, {
      alpha,
      mirror: item.mirror,
      reveal: progress,
      revealSeed: (item.revealSeed ^ layerSalt) >>> 0,
      layer,
    });
    if (layer === "gold" && plan.goldTreatment === "centre") draw(item.opacity * 0.3);
    context.save();
    if (layer === "gold" && plan.goldTreatment === "centre") {
      context.beginPath();
      context.ellipse(item.centerX * width, item.centerY * height, size * 0.24, size * 0.2, 0, 0, Math.PI * 2);
      context.clip();
    }
    draw(item.opacity);
    context.restore();
  }
}

interface BorderSegment { x: number; y: number; width: number; height: number }

function drawBorderReveal(
  context: CanvasRenderingContext2D,
  palette: Palette,
  width: number,
  height: number,
  plan: RefinedPatternPlan,
  progress: number,
): void {
  if (progress <= 0) return;
  if (progress >= 1) {
    drawThreadBorder(context, palette, width, height, plan.borderVariant);
    return;
  }
  const segments: BorderSegment[] = [
    { x: 0, y: 0, width: 0.56, height: 0.2 },
    { x: 0.44, y: 0, width: 0.56, height: 0.2 },
    { x: 0.8, y: 0, width: 0.2, height: 1 },
    { x: 0.44, y: 0.8, width: 0.56, height: 0.2 },
    { x: 0, y: 0.8, width: 0.56, height: 0.2 },
    { x: 0, y: 0, width: 0.2, height: 1 },
  ];
  const visible = Math.max(1, Math.ceil(clamp01(progress) * segments.length));
  for (let index = 0; index < visible; index += 1) {
    const segment = segments[(index + plan.borderStartSegment) % segments.length];
    context.save();
    context.beginPath();
    context.rect(segment.x * width, segment.y * height, segment.width * width, segment.height * height);
    context.clip();
    drawThreadBorder(context, palette, width, height, plan.borderVariant);
    context.restore();
  }
}

function drawStageGlow(
  context: CanvasRenderingContext2D,
  palette: Palette,
  plan: RefinedPatternPlan,
  stage: RefinedStageState,
  width: number,
  height: number,
): void {
  if (stage.completedRows >= 24) return;
  const main = plan.placements[0];
  if (stage.activeStage === "border") {
    context.save();
    context.strokeStyle = `${palette.colors[1]}70`;
    context.shadowColor = palette.colors[1];
    context.shadowBlur = Math.max(10, width * 0.014);
    context.lineWidth = Math.max(1, width / 700);
    roundedRectPath(context, width * 0.025, height * 0.025, width * 0.95, height * 0.95, Math.min(width, height) * 0.03);
    context.stroke();
    context.restore();
    return;
  }
  if (!main || stage.activeStage === "ground") return;
  const colour = stage.activeStage === "gold" ? palette.colors[1] : palette.colors[2];
  const radius = Math.min(width, height) * main.size * 0.55;
  const glow = context.createRadialGradient(main.centerX * width, main.centerY * height, 0, main.centerX * width, main.centerY * height, radius);
  glow.addColorStop(0, `${colour}18`);
  glow.addColorStop(0.6, `${colour}08`);
  glow.addColorStop(1, `${colour}00`);
  context.save();
  context.globalCompositeOperation = "screen";
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
  context.restore();
}

export interface RefinedPatternOptions {
  completedRows?: number;
  glow?: boolean;
}

export function paintRefinedPattern(
  context: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  recipe: PatternRecipe,
  palette: Palette,
  width: number,
  height: number,
  options: RefinedPatternOptions = {},
): void {
  const completedRows = clamp(options.completedRows ?? recipe.rows, 0, recipe.rows);
  const stage = getRefinedStageState(completedRows, recipe.rows);
  const plan = createRefinedPatternPlan(recipe);
  context.clearRect(0, 0, width, height);
  drawWarpGround(context, palette, width, height, stage.ground, plan.groundPhase);
  if (completedRows < 18) {
    context.save();
    context.globalAlpha = 0.1;
    drawMotifComposition(context, atlas, plan, palette, width, height, "colour", 1);
    drawMotifComposition(context, atlas, plan, palette, width, height, "gold", 1);
    context.restore();
  }
  if (completedRows === 0) return;

  // Four six-pass sections reveal semantic layers over the whole textile. This is
  // intentionally not a top-to-bottom crop: distributed ground threads, colour,
  // gold and the closing border each have their own deterministic reveal mask.
  drawMotifComposition(context, atlas, plan, palette, width, height, "colour", stage.colour);
  drawMotifComposition(context, atlas, plan, palette, width, height, "gold", stage.gold);
  drawBorderReveal(context, palette, width, height, plan, stage.border);
  if (options.glow) drawStageGlow(context, palette, plan, stage, width, height);
}
