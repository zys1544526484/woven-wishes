import { INTENT_LAYOUTS, INTENT_MOTIFS, MOTIFS, PALETTES } from "../content/motifs";
import { seededRandom } from "./hash";
import type { PatternMatrix, PatternRecipe, WishAnalysis, PaletteId } from "./types";

const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

function choose<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length) % values.length];
}

export function composePattern(analysis: WishAnalysis): PatternRecipe {
  const random = seededRandom(analysis.seed);
  const [defaultPrimary, defaultSecondary] = INTENT_MOTIFS[analysis.primaryIntent];
  const primaryMotif = analysis.fallback ? "cloud" : defaultPrimary;
  const secondaryMotif = analysis.secondaryIntent
    ? INTENT_MOTIFS[analysis.secondaryIntent][0]
    : defaultSecondary;
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

function placeMask(
  matrix: PatternMatrix,
  motifId: string,
  originX: number,
  originY: number,
  mirrorX = false,
  colorShift = 0,
): void {
  const motif = MOTIFS[motifId];
  if (!motif) return;
  const source = motif.bitmapMask;
  const width = source[0]?.length ?? 0;
  for (let sourceY = 0; sourceY < source.length; sourceY += 1) {
    for (let sourceX = 0; sourceX < width; sourceX += 1) {
      const value = source[sourceY][mirrorX ? width - 1 - sourceX : sourceX];
      if (!value) continue;
      const targetY = originY + sourceY;
      const targetX = originX + sourceX;
      if (targetY < 0 || targetY >= matrix.length || targetX < 0 || targetX >= matrix[0].length) continue;
      matrix[targetY][targetX] = ((value - 1 + colorShift) % 3) + 1;
    }
  }
}

function drawBorder(matrix: PatternMatrix, accent = 1): void {
  const rows = matrix.length;
  const columns = matrix[0].length;
  for (let x = 0; x < columns; x += 1) {
    if (x % 3 !== 1) {
      matrix[0][x] = accent;
      matrix[rows - 1][x] = accent;
    }
    if (x % 6 === 2) {
      matrix[1][x] = 2;
      matrix[rows - 2][x] = 2;
    }
  }
}

function drawDiamondLattice(matrix: PatternMatrix, offsetY: number, height: number): void {
  const columns = matrix[0].length;
  for (let y = offsetY; y < Math.min(matrix.length, offsetY + height); y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const localX = x % 12;
      const localY = (y - offsetY) % 8;
      if (Math.abs(localX - 6) + Math.abs(localY - 4) === 4) matrix[y][x] = 1;
    }
  }
}

export function generatePatternMatrix(recipe: PatternRecipe): PatternMatrix {
  const matrix = Array.from({ length: recipe.rows }, () => Array<number>(recipe.columns).fill(0));
  const random = seededRandom(recipe.seed ^ 0xa19f3d7b);
  const mirror = random() > 0.5;
  drawBorder(matrix, 1);

  if (recipe.layout === "continuous") {
    for (let x = -2; x < recipe.columns; x += 12) {
      placeMask(matrix, recipe.primaryMotif, x, 3, mirror, x % 24 === 0 ? 0 : 1);
      if (recipe.secondaryMotif) placeMask(matrix, recipe.secondaryMotif, x + 5, 13, !mirror, 1);
    }
  } else if (recipe.layout === "roundel") {
    drawDiamondLattice(matrix, 3, 18);
    placeMask(matrix, recipe.primaryMotif, 19, 8, mirror, 0);
    if (recipe.secondaryMotif) {
      placeMask(matrix, recipe.secondaryMotif, 4, 8, false, 1);
      placeMask(matrix, recipe.secondaryMotif, 35, 8, true, 1);
    }
  } else if (recipe.layout === "scattered") {
    const positions = [[2, 3], [18, 4], [34, 3], [9, 13], [27, 13]] as const;
    positions.forEach(([x, y], index) => {
      placeMask(matrix, index % 2 === 0 ? recipe.primaryMotif : recipe.secondaryMotif ?? recipe.primaryMotif, x, y, mirror !== (index % 2 === 0), index % 3);
    });
  } else {
    drawDiamondLattice(matrix, 3, 18);
    for (let x = 1; x < recipe.columns; x += 15) {
      placeMask(matrix, recipe.secondaryMotif ?? recipe.primaryMotif, x, 4, x % 2 === 0, 1);
    }
    placeMask(matrix, recipe.primaryMotif, 19, 10, mirror, 0);
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
