import motifAtlasUrl from "../assets/motif-atlas-v1.3.png";
import type { Palette, PatternRecipe } from "../core/types";

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

let atlasPromise: Promise<HTMLImageElement> | undefined;
const tintedMotifs = new Map<string, HTMLCanvasElement>();

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

function tintedMotif(atlas: HTMLImageElement, motifId: string, palette: Palette): HTMLCanvasElement {
  const region = MOTIF_ATLAS_REGIONS[motifId] ?? MOTIF_ATLAS_REGIONS.cloud;
  const cacheKey = `${motifId}:${palette.id}`;
  const cached = tintedMotifs.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = region.width;
  canvas.height = region.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;
  context.drawImage(atlas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
  const imageData = context.getImageData(0, 0, region.width, region.height);
  const gold = liftThreadColor(parseHex(palette.colors[1]), 0.06);
  const teal = liftThreadColor(parseHex(palette.colors[2]), 0.24);
  const accent = liftThreadColor(parseHex(palette.colors[3]), 0.18);

  for (let index = 0; index < imageData.data.length; index += 4) {
    const red = imageData.data[index];
    const green = imageData.data[index + 1];
    const blue = imageData.data[index + 2];
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const chroma = maximum - minimum;
    if (maximum < 36 || chroma < 8) {
      imageData.data[index + 3] = 0;
      continue;
    }
    const goldThread = red > blue * 1.24 && green > blue * 1.12;
    const accentThread = !goldThread && red > 74 && blue > 58 && red > green * 1.08;
    const target = accentThread ? accent : goldThread ? gold : teal;
    const threadStrength = Math.min(1, Math.max(0, (maximum - 32) / 150));
    const brightness = 0.72 + threadStrength * 0.56;
    imageData.data[index] = Math.min(255, target[0] * brightness);
    imageData.data[index + 1] = Math.min(255, target[1] * brightness);
    imageData.data[index + 2] = Math.min(255, target[2] * brightness);
    imageData.data[index + 3] = Math.round(255 * (0.6 + threadStrength * 0.4));
  }
  context.clearRect(0, 0, region.width, region.height);
  context.putImageData(imageData, 0, 0);
  tintedMotifs.set(cacheKey, canvas);
  return canvas;
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

function drawWarpGround(context: CanvasRenderingContext2D, palette: Palette, width: number, height: number): void {
  context.fillStyle = palette.colors[0];
  context.fillRect(0, 0, width, height);
  const glow = context.createRadialGradient(width * 0.5, height * 0.44, 0, width * 0.5, height * 0.44, Math.max(width, height) * 0.65);
  glow.addColorStop(0, `${palette.colors[2]}2b`);
  glow.addColorStop(0.5, `${palette.colors[0]}00`);
  glow.addColorStop(1, "rgba(0,0,0,.3)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.lineWidth = Math.max(0.5, width / 2200);
  for (let x = 0; x <= width; x += Math.max(5, width / 112)) {
    context.strokeStyle = x % 3 < 1 ? `${palette.colors[1]}18` : `${palette.colors[2]}20`;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += Math.max(4, height / 76)) {
    context.strokeStyle = y % 3 < 1 ? `${palette.colors[1]}12` : `${palette.colors[2]}14`;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

function drawThreadBorder(context: CanvasRenderingContext2D, palette: Palette, width: number, height: number, variant: number): void {
  const outer = Math.max(10, Math.min(width, height) * 0.026);
  const inner = outer + Math.max(8, Math.min(width, height) * 0.018);
  const radius = Math.max(10, Math.min(width, height) * 0.025);
  context.save();
  context.shadowColor = `${palette.colors[1]}70`;
  context.shadowBlur = Math.max(7, width * 0.009);
  context.strokeStyle = palette.colors[1];
  context.lineWidth = Math.max(1.4, width / 540);
  roundedRectPath(context, outer, outer, width - outer * 2, height - outer * 2, radius);
  context.stroke();
  context.shadowBlur = 0;
  context.strokeStyle = palette.colors[2];
  context.lineWidth = Math.max(1, width / 900);
  roundedRectPath(context, inner, inner, width - inner * 2, height - inner * 2, radius * 0.72);
  context.stroke();

  const horizontalStart = inner + radius;
  const horizontalEnd = width - inner - radius;
  const step = Math.max(14, width / 34);
  const amplitude = Math.max(4, height * 0.011);
  for (const edgeY of [inner + amplitude * 1.7, height - inner - amplitude * 1.7]) {
    context.beginPath();
    for (let x = horizontalStart; x <= horizontalEnd; x += 2) {
      const phase = ((x - horizontalStart) / step) * Math.PI * 2;
      const y = edgeY + Math.sin(phase + variant * 0.7) * amplitude;
      if (x === horizontalStart) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = palette.colors[1];
    context.lineWidth = Math.max(1, width / 950);
    context.setLineDash([Math.max(1, width / 980), Math.max(2, width / 430)]);
    context.stroke();
  }
  context.setLineDash([]);

  const verticalStep = Math.max(16, height / 20);
  for (const edgeX of [inner + amplitude * 1.6, width - inner - amplitude * 1.6]) {
    for (let y = inner + radius; y < height - inner - radius; y += verticalStep) {
      context.strokeStyle = (Math.floor(y / verticalStep) + variant) % 2 ? palette.colors[1] : palette.colors[2];
      context.lineWidth = Math.max(1, width / 980);
      context.beginPath();
      context.ellipse(edgeX, y, amplitude * 0.68, amplitude, 0, 0, Math.PI * 2);
      context.stroke();
    }
  }
  context.restore();
}

function drawMotifLayer(
  context: CanvasRenderingContext2D,
  motif: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 1,
  mirror = false,
): void {
  const insetX = motif.width * 0.095;
  const insetY = motif.height * 0.095;
  context.save();
  context.globalAlpha = alpha;
  context.globalCompositeOperation = "screen";
  context.filter = "brightness(1.1) contrast(1.06) saturate(1.08)";
  context.shadowColor = "rgba(227,179,79,.22)";
  context.shadowBlur = Math.max(4, width * 0.007);
  if (mirror) {
    context.translate(x + width, y);
    context.scale(-1, 1);
    context.drawImage(motif, insetX, insetY, motif.width - insetX * 2, motif.height - insetY * 2, 0, 0, width, height);
  } else {
    context.drawImage(motif, insetX, insetY, motif.width - insetX * 2, motif.height - insetY * 2, x, y, width, height);
  }
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
  const completedRows = Math.min(recipe.rows, Math.max(0, options.completedRows ?? recipe.rows));
  const visibleRatio = completedRows / recipe.rows;
  context.clearRect(0, 0, width, height);
  drawWarpGround(context, palette, width, height);
  if (completedRows === 0) return;

  context.save();
  context.beginPath();
  context.rect(0, 0, width, height * visibleRatio);
  context.clip();

  for (let row = 0; row < completedRows; row += 1) {
    const y = (row + 0.5) * (height / recipe.rows);
    context.strokeStyle = row % 2 ? `${palette.colors[2]}22` : `${palette.colors[1]}20`;
    context.lineWidth = Math.max(0.8, height / 980);
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  drawThreadBorder(context, palette, width, height, recipe.seed & 3);
  const mainMotif = tintedMotif(atlas, recipe.primaryMotif, palette);
  const secondaryMotif = tintedMotif(atlas, recipe.secondaryMotif ?? recipe.primaryMotif, palette);
  if (recipe.secondaryMotif) {
    const primaryHeight = height * 0.66;
    const primaryWidth = Math.min(width * 0.56, primaryHeight);
    const secondarySize = Math.min(width, height) * 0.38;
    drawMotifLayer(context, mainMotif, width * 0.07, height * 0.17, primaryWidth, primaryHeight);
    drawMotifLayer(context, secondaryMotif, width * 0.61, height * 0.43, secondarySize, secondarySize, 0.94, true);
    context.save();
    context.strokeStyle = `${palette.colors[1]}88`;
    context.lineWidth = Math.max(1, width / 1200);
    context.setLineDash([Math.max(2, width / 360), Math.max(4, width / 190)]);
    context.beginPath();
    context.moveTo(width * 0.49, height * 0.53);
    context.bezierCurveTo(width * 0.58, height * 0.42, width * 0.61, height * 0.66, width * 0.69, height * 0.61);
    context.stroke();
    context.restore();
  } else {
    const mainHeight = height * (recipe.layout === "roundel" ? 0.78 : 0.73);
    const mainWidth = Math.min(width * 0.68, mainHeight);
    const mainY = (height - mainHeight) * 0.5;
    let mainX = (width - mainWidth) * 0.5;
    if (recipe.layout === "combined") mainX -= width * 0.055;
    if (recipe.layout === "scattered") mainX -= width * 0.035;
    drawMotifLayer(context, mainMotif, mainX, mainY, mainWidth, mainHeight);

    if (recipe.layout === "combined" || recipe.layout === "scattered") {
    const echoSize = Math.min(width, height) * (recipe.layout === "combined" ? 0.25 : 0.2);
    const echoX = recipe.layout === "combined" ? width * 0.7 : width * 0.73;
    const echoY = recipe.layout === "combined" ? height * 0.56 : height * 0.66;
    drawMotifLayer(context, secondaryMotif, echoX, echoY, echoSize, echoSize, 0.84, true);
    } else if (recipe.layout === "continuous") {
      const echoSize = Math.min(width, height) * 0.2;
      drawMotifLayer(context, secondaryMotif, width * 0.075, height * 0.65, echoSize, echoSize, 0.68);
      drawMotifLayer(context, secondaryMotif, width - width * 0.075 - echoSize, height * 0.65, echoSize, echoSize, 0.68, true);
    }
  }
  context.restore();

  if (options.glow && completedRows < recipe.rows) {
    const edgeY = height * visibleRatio;
    const edgeGlow = context.createLinearGradient(0, edgeY - height / recipe.rows, 0, edgeY + height / recipe.rows);
    edgeGlow.addColorStop(0, `${palette.colors[1]}00`);
    edgeGlow.addColorStop(0.5, `${palette.colors[1]}dd`);
    edgeGlow.addColorStop(1, `${palette.colors[1]}00`);
    context.fillStyle = edgeGlow;
    context.fillRect(0, edgeY - height / recipe.rows, width, (height / recipe.rows) * 2);
  }
}
