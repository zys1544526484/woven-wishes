import { INTENT_LAYOUTS, INTENT_MOTIFS, PALETTES } from "../content/motifs";
import { createPatternProposal } from "../content/proposals";
import { seededRandom } from "./hash";
import type { PatternMatrix, PatternProposal, PatternRecipe, WishAnalysis, PaletteId, ProposalId } from "./types";

const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

function choose<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length) % values.length];
}

export function composePattern(analysis: WishAnalysis): PatternRecipe {
  const random = seededRandom(analysis.seed);
  const motifChoices = INTENT_MOTIFS[analysis.primaryIntent];
  const primaryMotif = analysis.fallback ? "cloud" : choose(motifChoices, random);
  const intentSecondary = analysis.secondaryIntent
    ? choose(INTENT_MOTIFS[analysis.secondaryIntent], random)
    : motifChoices.find((motif) => motif !== primaryMotif);
  const secondaryMotif = intentSecondary === primaryMotif
    ? motifChoices.find((motif) => motif !== primaryMotif)
    : intentSecondary;
  return {
    version: 1,
    seed: analysis.seed,
    rows: 24,
    columns: 48,
    primaryMotif,
    secondaryMotif,
    palette: choose(PALETTE_IDS, random),
    layout: choose(INTENT_LAYOUTS[analysis.primaryIntent], random),
  };
}

const ALL_LAYOUTS: readonly PatternRecipe["layout"][] = ["continuous", "roundel", "combined", "scattered"];
const PROPOSAL_IDS: readonly ProposalId[] = ["A", "B", "C"];

export function composePatternProposals(analysis: WishAnalysis): PatternProposal[] {
  const base = composePattern(analysis);
  const [firstMotif, secondMotif] = INTENT_MOTIFS[analysis.primaryIntent];
  const [firstLayout, secondLayout] = INTENT_LAYOUTS[analysis.primaryIntent];
  const remainingLayouts = ALL_LAYOUTS.filter((layout) => layout !== firstLayout && layout !== secondLayout);
  const compositeLayout = remainingLayouts[analysis.seed % remainingLayouts.length];
  const recipes: PatternRecipe[] = [
    { ...base, primaryMotif: firstMotif, secondaryMotif: undefined, layout: firstLayout },
    { ...base, seed: (base.seed + 0x9e3779b1) >>> 0, primaryMotif: secondMotif, secondaryMotif: undefined, layout: secondLayout },
    { ...base, seed: (base.seed + 0x3c6ef362) >>> 0, primaryMotif: firstMotif, secondaryMotif: secondMotif, layout: compositeLayout },
  ];
  return recipes.map((recipe, index) => createPatternProposal(PROPOSAL_IDS[index], analysis.primaryIntent, recipe));
}

/** @deprecated Use composePatternProposals when UI copy and proposal identity are required. */
export function composePatternCandidates(analysis: WishAnalysis): PatternRecipe[] {
  return composePatternProposals(analysis).map((proposal) => proposal.recipe);
}

interface Point { x: number; y: number }

function setCell(matrix: PatternMatrix, x: number, y: number, color: number, radius = 0): void {
  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      const targetX = Math.round(x + offsetX);
      const targetY = Math.round(y + offsetY);
      if (targetY < 2 || targetY >= matrix.length - 2 || targetX < 1 || targetX >= matrix[0].length - 1) continue;
      matrix[targetY][targetX] = color;
    }
  }
}

function drawLine(matrix: PatternMatrix, from: Point, to: Point, color: number, radius = 0): void {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1) * 3;
  for (let index = 0; index <= steps; index += 1) {
    const progress = index / steps;
    setCell(matrix, from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress, color, radius);
  }
}

function drawQuadratic(matrix: PatternMatrix, from: Point, control: Point, to: Point, color: number, radius = 0): void {
  for (let index = 0; index <= 42; index += 1) {
    const progress = index / 42;
    const inverse = 1 - progress;
    setCell(
      matrix,
      inverse * inverse * from.x + 2 * inverse * progress * control.x + progress * progress * to.x,
      inverse * inverse * from.y + 2 * inverse * progress * control.y + progress * progress * to.y,
      color,
      radius,
    );
  }
}

function drawEllipse(matrix: PatternMatrix, centerX: number, centerY: number, radiusX: number, radiusY: number, color: number): void {
  for (let index = 0; index < 96; index += 1) {
    const angle = (index / 96) * Math.PI * 2;
    setCell(matrix, centerX + Math.cos(angle) * radiusX, centerY + Math.sin(angle) * radiusY, color);
  }
}

function fillEllipse(matrix: PatternMatrix, centerX: number, centerY: number, radiusX: number, radiusY: number, color: number): void {
  for (let y = Math.floor(centerY - radiusY); y <= Math.ceil(centerY + radiusY); y += 1) {
    for (let x = Math.floor(centerX - radiusX); x <= Math.ceil(centerX + radiusX); x += 1) {
      const normalizedX = (x - centerX) / radiusX;
      const normalizedY = (y - centerY) / radiusY;
      if (normalizedX * normalizedX + normalizedY * normalizedY <= 1) setCell(matrix, x, y, color);
    }
  }
}

function fillTriangle(matrix: PatternMatrix, a: Point, b: Point, c: Point, color: number): void {
  const minX = Math.floor(Math.min(a.x, b.x, c.x));
  const maxX = Math.ceil(Math.max(a.x, b.x, c.x));
  const minY = Math.floor(Math.min(a.y, b.y, c.y));
  const maxY = Math.ceil(Math.max(a.y, b.y, c.y));
  const area = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  if (area === 0) return;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const first = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / area;
      const second = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / area;
      const third = 1 - first - second;
      if (first >= 0 && second >= 0 && third >= 0) setCell(matrix, x, y, color);
    }
  }
}

function drawPetal(matrix: PatternMatrix, centerX: number, centerY: number, angle: number, length: number, width: number, color: number): void {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  const perpendicular = { x: -direction.y, y: direction.x };
  const start = { x: centerX, y: centerY };
  const tip = { x: centerX + direction.x * length, y: centerY + direction.y * length };
  drawQuadratic(matrix, start, {
    x: centerX + direction.x * length * 0.48 + perpendicular.x * width,
    y: centerY + direction.y * length * 0.48 + perpendicular.y * width,
  }, tip, color);
  drawQuadratic(matrix, tip, {
    x: centerX + direction.x * length * 0.48 - perpendicular.x * width,
    y: centerY + direction.y * length * 0.48 - perpendicular.y * width,
  }, start, color);
}

function drawBorder(matrix: PatternMatrix, primary: number, secondary: number, variant: number): void {
  const lastRow = matrix.length - 1;
  for (let x = 0; x < matrix[0].length; x += 1) {
    if (variant === 0) {
      matrix[0][x] = x % 4 === 1 ? 0 : primary;
      matrix[lastRow][x] = x % 4 === 1 ? 0 : primary;
      if (x % 8 === 2 || x % 8 === 3) {
        matrix[1][x] = secondary;
        matrix[lastRow - 1][x] = secondary;
      }
    } else if (variant === 1) {
      matrix[0][x] = x % 2 === 0 ? primary : 0;
      matrix[lastRow][x] = x % 2 === 0 ? primary : 0;
      if (x % 6 === 1 || x % 6 === 2) {
        matrix[1][x] = secondary;
        matrix[lastRow - 1][matrix[0].length - 1 - x] = secondary;
      }
    } else if (variant === 2) {
      matrix[0][x] = x % 5 === 0 ? secondary : primary;
      matrix[lastRow][x] = x % 5 === 0 ? secondary : primary;
      if (x % 4 === 0) {
        matrix[1][x] = primary;
        matrix[lastRow - 1][x] = primary;
      }
    } else {
      const color = x % 8 < 4 ? primary : secondary;
      matrix[0][x] = x % 3 === 1 ? 0 : color;
      matrix[lastRow][x] = x % 3 === 1 ? 0 : color;
      if (x % 8 === 3 || x % 8 === 4) {
        matrix[1][x] = color;
        matrix[lastRow - 1][x] = color;
      }
    }
  }
}

function drawRoundel(matrix: PatternMatrix, centerX: number, primary: number, secondary: number): void {
  drawEllipse(matrix, centerX, 11.5, 13, 8.5, primary);
  [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((angle, index) => {
    drawPetal(matrix, centerX, 11.5, angle, index % 2 === 0 ? 10 : 7.5, 4.2, index % 2 === 0 ? secondary : primary);
  });
  drawEllipse(matrix, centerX, 11.5, 2.1, 1.5, 3);
  setCell(matrix, centerX, 11.5, 3, 1);
}

function drawSpiral(matrix: PatternMatrix, centerX: number, centerY: number, radius: number, color: number, reverse = false): void {
  for (let index = 0; index <= 70; index += 1) {
    const progress = index / 70;
    const angle = (reverse ? -1 : 1) * progress * Math.PI * 3.3;
    const distance = radius * (1 - progress * 0.88);
    setCell(matrix, centerX + Math.cos(angle) * distance, centerY + Math.sin(angle) * distance * 0.62, color);
  }
}

function drawCloud(matrix: PatternMatrix, centerX: number, primary: number, secondary: number): void {
  drawQuadratic(matrix, { x: centerX - 17, y: 15 }, { x: centerX - 10, y: 19 }, { x: centerX, y: 16 }, primary);
  drawQuadratic(matrix, { x: centerX, y: 16 }, { x: centerX + 11, y: 20 }, { x: centerX + 17, y: 14 }, primary);
  drawQuadratic(matrix, { x: centerX - 16, y: 14 }, { x: centerX - 13, y: 6 }, { x: centerX - 6, y: 9 }, secondary);
  drawQuadratic(matrix, { x: centerX - 6, y: 9 }, { x: centerX, y: 2.5 }, { x: centerX + 5, y: 9 }, secondary);
  drawQuadratic(matrix, { x: centerX + 5, y: 9 }, { x: centerX + 13, y: 5 }, { x: centerX + 16, y: 13 }, secondary);
  drawSpiral(matrix, centerX - 8, 13, 5, primary);
  drawSpiral(matrix, centerX + 7, 12, 5.5, primary, true);
  drawLine(matrix, { x: centerX - 13, y: 18 }, { x: centerX + 14, y: 18 }, secondary);
}

function drawBamboo(matrix: PatternMatrix, centerX: number, primary: number, secondary: number): void {
  drawLine(matrix, { x: centerX - 3, y: 20 }, { x: centerX + 1, y: 3 }, primary, 1);
  drawLine(matrix, { x: centerX + 7, y: 20 }, { x: centerX + 9, y: 6 }, secondary);
  [6, 10, 14, 18].forEach((y) => drawLine(matrix, { x: centerX - 5 + (20 - y) * 0.22, y }, { x: centerX + (20 - y) * 0.22, y }, 3));
  [9, 13, 17].forEach((y) => drawLine(matrix, { x: centerX + 5, y }, { x: centerX + 10, y }, 3));
  drawPetal(matrix, centerX, 9, Math.PI * 1.18, 9, 2.3, secondary);
  drawPetal(matrix, centerX + 1, 12, -0.3, 10, 2.5, secondary);
  drawPetal(matrix, centerX + 7, 10, Math.PI * 1.12, 8, 2.2, primary);
  drawPetal(matrix, centerX + 8, 14, 0.12, 9, 2.2, primary);
}

function drawBlossom(matrix: PatternMatrix, centerX: number, centerY: number, primary: number, secondary: number): void {
  for (let index = 0; index < 5; index += 1) {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / 5);
    drawPetal(matrix, centerX, centerY, angle, 3.2, 1.5, primary);
  }
  setCell(matrix, centerX, centerY, secondary, 1);
}

function drawPlum(matrix: PatternMatrix, centerX: number, primary: number, secondary: number): void {
  drawLine(matrix, { x: centerX - 18, y: 19 }, { x: centerX + 16, y: 5 }, primary, 1);
  drawLine(matrix, { x: centerX - 4, y: 13 }, { x: centerX - 11, y: 6 }, primary);
  drawLine(matrix, { x: centerX + 6, y: 10 }, { x: centerX + 5, y: 3 }, primary);
  drawLine(matrix, { x: centerX + 9, y: 8 }, { x: centerX + 17, y: 11 }, primary);
  drawBlossom(matrix, centerX - 10, 6, secondary, 3);
  drawBlossom(matrix, centerX + 5, 5, secondary, 3);
  drawBlossom(matrix, centerX + 16, 11, secondary, 3);
  drawBlossom(matrix, centerX - 1, 13, secondary, 3);
}

function drawFish(matrix: PatternMatrix, centerX: number, centerY: number, direction: 1 | -1, primary: number, secondary: number): void {
  fillEllipse(matrix, centerX, centerY, 7.5, 4, primary);
  drawEllipse(matrix, centerX, centerY, 7.5, 4, 3);
  const tailX = centerX - direction * 7;
  fillTriangle(matrix, { x: tailX, y: centerY }, { x: tailX - direction * 5, y: centerY - 4 }, { x: tailX - direction * 5, y: centerY + 4 }, secondary);
  setCell(matrix, centerX + direction * 4, centerY - 1, 3);
  drawQuadratic(matrix, { x: centerX - direction * 2, y: centerY }, { x: centerX, y: centerY - 4 }, { x: centerX + direction * 2, y: centerY }, secondary);
}

function drawPairedFish(matrix: PatternMatrix, centerX: number, primary: number, secondary: number): void {
  drawFish(matrix, centerX - 8, 8, 1, primary, secondary);
  drawFish(matrix, centerX + 8, 15, -1, secondary, primary);
  drawQuadratic(matrix, { x: centerX - 17, y: 16 }, { x: centerX, y: 23 }, { x: centerX + 17, y: 8 }, 3);
}

function drawPeony(matrix: PatternMatrix, centerX: number, primary: number, secondary: number): void {
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4;
    drawPetal(matrix, centerX, 11.5, angle, index % 2 === 0 ? 8.5 : 6.5, 3, index % 2 === 0 ? primary : secondary);
  }
  drawEllipse(matrix, centerX, 11.5, 12.5, 8.5, secondary);
  setCell(matrix, centerX, 11.5, 3, 1);
}

function drawMagpie(matrix: PatternMatrix, centerX: number, primary: number, secondary: number): void {
  drawLine(matrix, { x: centerX - 19, y: 18 }, { x: centerX + 19, y: 16 }, secondary);
  drawLine(matrix, { x: centerX + 10, y: 16.5 }, { x: centerX + 17, y: 12 }, secondary);
  fillEllipse(matrix, centerX + 1, 11, 8.5, 5.5, primary);
  fillEllipse(matrix, centerX + 8, 7, 3.2, 2.8, primary);
  fillTriangle(matrix, { x: centerX + 10.5, y: 7 }, { x: centerX + 15, y: 8 }, { x: centerX + 11, y: 9 }, 3);
  fillTriangle(matrix, { x: centerX - 5, y: 11 }, { x: centerX - 18, y: 4 }, { x: centerX - 9, y: 13 }, secondary);
  fillTriangle(matrix, { x: centerX - 5, y: 13 }, { x: centerX - 17, y: 9 }, { x: centerX - 8, y: 15 }, 3);
  drawPetal(matrix, centerX + 1, 11, -0.45, 6, 2.5, secondary);
  drawLine(matrix, { x: centerX - 1, y: 16 }, { x: centerX - 1, y: 18 }, 3);
  drawLine(matrix, { x: centerX + 4, y: 16 }, { x: centerX + 5, y: 18 }, 3);
  setCell(matrix, centerX + 9, 6.5, 3);
}

function drawPeach(matrix: PatternMatrix, centerX: number, primary: number, secondary: number): void {
  const top = { x: centerX, y: 5 };
  const bottom = { x: centerX, y: 20 };
  drawQuadratic(matrix, top, { x: centerX - 15, y: 3 }, { x: centerX - 13, y: 11 }, primary);
  drawQuadratic(matrix, { x: centerX - 13, y: 11 }, { x: centerX - 9, y: 18 }, bottom, primary);
  drawQuadratic(matrix, bottom, { x: centerX + 9, y: 18 }, { x: centerX + 13, y: 11 }, primary);
  drawQuadratic(matrix, { x: centerX + 13, y: 11 }, { x: centerX + 15, y: 3 }, top, primary);
  drawQuadratic(matrix, top, { x: centerX + 7, y: 3 }, { x: centerX + 10, y: 5 }, secondary);
  drawQuadratic(matrix, { x: centerX + 10, y: 5 }, { x: centerX + 6, y: 9 }, top, secondary);
  drawQuadratic(matrix, { x: centerX, y: 7 }, { x: centerX - 3, y: 12 }, bottom, secondary);
}

function drawMotif(matrix: PatternMatrix, motifId: string, centerX: number, primary: number, secondary: number): void {
  switch (motifId) {
    case "roundel": drawRoundel(matrix, centerX, primary, secondary); break;
    case "bamboo": drawBamboo(matrix, centerX, primary, secondary); break;
    case "plum": drawPlum(matrix, centerX, primary, secondary); break;
    case "fish": drawPairedFish(matrix, centerX, primary, secondary); break;
    case "peony": drawPeony(matrix, centerX, primary, secondary); break;
    case "magpie": drawMagpie(matrix, centerX, primary, secondary); break;
    case "peach": drawPeach(matrix, centerX, primary, secondary); break;
    case "cloud":
    default: drawCloud(matrix, centerX, primary, secondary); break;
  }
}

interface MotifBox { x: number; y: number; width: number; height: number; mirror?: boolean }

function createMotifMatrix(motifId: string, primary: number, secondary: number): PatternMatrix {
  const matrix = Array.from({ length: 24 }, () => Array<number>(48).fill(0));
  drawMotif(matrix, motifId, 24, primary, secondary);
  return matrix;
}

function motifBounds(matrix: PatternMatrix): { left: number; top: number; right: number; bottom: number } {
  let left = matrix[0].length;
  let top = matrix.length;
  let right = 0;
  let bottom = 0;
  matrix.forEach((row, y) => row.forEach((value, x) => {
    if (value === 0) return;
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }));
  return { left, top, right, bottom };
}

function placeMotif(target: PatternMatrix, source: PatternMatrix, box: MotifBox): void {
  const bounds = motifBounds(source);
  const sourceWidth = Math.max(1, bounds.right - bounds.left);
  const sourceHeight = Math.max(1, bounds.bottom - bounds.top);
  const scale = Math.min((box.width - 1) / sourceWidth, (box.height - 1) / sourceHeight);
  const drawnWidth = sourceWidth * scale;
  const drawnHeight = sourceHeight * scale;
  const offsetX = box.x + (box.width - drawnWidth) / 2;
  const offsetY = box.y + (box.height - drawnHeight) / 2;
  source.forEach((row, y) => row.forEach((value, x) => {
    if (value === 0) return;
    const relativeX = box.mirror ? bounds.right - x : x - bounds.left;
    setCell(target, offsetX + relativeX * scale, offsetY + (y - bounds.top) * scale, value);
  }));
}

export function generatePatternMatrix(recipe: PatternRecipe): PatternMatrix {
  const matrix = Array.from({ length: recipe.rows }, () => Array<number>(recipe.columns).fill(0));
  const random = seededRandom(recipe.seed ^ 0xa19f3d7b);
  const primary = random() > 0.5 ? 1 : 2;
  const secondary = primary === 1 ? 2 : 1;
  drawBorder(matrix, primary, secondary, Math.floor(random() * 4));

  if (recipe.layout === "roundel") {
    drawMotif(matrix, recipe.primaryMotif, recipe.columns / 2, primary, secondary);
  } else {
    const primaryMatrix = createMotifMatrix(recipe.primaryMotif, primary, secondary);
    const secondaryMatrix = createMotifMatrix(recipe.secondaryMotif ?? recipe.primaryMotif, secondary, primary);
    if (recipe.layout === "continuous") {
      placeMotif(matrix, primaryMatrix, { x: 1, y: 3, width: 24, height: 18 });
      placeMotif(matrix, primaryMatrix, { x: 23, y: 3, width: 24, height: 18, mirror: true });
    } else if (recipe.layout === "scattered") {
      placeMotif(matrix, primaryMatrix, { x: 1, y: 2, width: 31, height: 15 });
      placeMotif(matrix, secondaryMatrix, { x: 25, y: 9, width: 21, height: 12, mirror: true });
    } else {
      placeMotif(matrix, primaryMatrix, { x: 1, y: 2, width: 33, height: 19 });
      placeMotif(matrix, secondaryMatrix, { x: 30, y: 5, width: 16, height: 13 });
    }
  }

  return matrix;
}

export function patternHash(matrix: PatternMatrix): string {
  let hash = 0x811c9dc5;
  for (const row of matrix) {
    for (const value of row) {
      hash ^= value;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, "0");
}
