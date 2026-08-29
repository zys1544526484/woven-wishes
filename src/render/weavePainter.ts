import type { Palette, PatternMatrix } from "../core/types";

export interface PaintOptions {
  completedRows?: number;
  padding?: number;
  glow?: boolean;
}

export function paintWovenMatrix(
  context: CanvasRenderingContext2D,
  matrix: PatternMatrix,
  palette: Palette,
  width: number,
  height: number,
  options: PaintOptions = {},
): void {
  const { completedRows = matrix.length, padding = 0, glow = true } = options;
  const rows = matrix.length;
  const columns = matrix[0]?.length ?? 0;
  if (!rows || !columns) return;

  context.clearRect(0, 0, width, height);
  context.fillStyle = palette.colors[0];
  context.fillRect(0, 0, width, height);

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const cellWidth = innerWidth / columns;
  const cellHeight = innerHeight / rows;

  context.save();
  context.translate(padding, padding);
  context.lineWidth = Math.max(0.45, Math.min(cellWidth, cellHeight) * 0.07);
  context.strokeStyle = "rgba(19, 147, 155, 0.18)";
  for (let x = 0; x <= columns; x += 1) {
    const xPosition = x * cellWidth;
    context.beginPath();
    context.moveTo(xPosition, 0);
    context.lineTo(xPosition, innerHeight);
    context.stroke();
  }

  const visibleRows = Math.min(completedRows, rows);
  for (let row = 0; row < visibleRows; row += 1) {
    const y = row * cellHeight;
    const bandHeight = Math.max(2, cellHeight * 0.5);
    const bandY = y + (cellHeight - bandHeight) / 2;
    context.strokeStyle = row % 2 === 0 ? "rgba(214,164,88,0.17)" : "rgba(8,116,124,0.17)";
    context.beginPath();
    context.moveTo(0, y + cellHeight * 0.5);
    context.lineTo(innerWidth, y + cellHeight * 0.5);
    context.stroke();

    for (let column = 0; column < columns; column += 1) {
      const value = matrix[row][column];
      if (value === 0) continue;
      const x = column * cellWidth;
      const bandWidth = Math.ceil(cellWidth + 0.5);
      context.fillStyle = palette.colors[value];
      context.fillRect(x, bandY, bandWidth, bandHeight);

      const shade = context.createLinearGradient(0, bandY, 0, bandY + bandHeight);
      shade.addColorStop(0, "rgba(255,255,255,0.24)");
      shade.addColorStop(0.18, "rgba(255,255,255,0.05)");
      shade.addColorStop(0.76, "rgba(0,0,0,0.05)");
      shade.addColorStop(1, "rgba(0,0,0,0.28)");
      context.fillStyle = shade;
      context.fillRect(x, bandY, bandWidth, bandHeight);

      context.strokeStyle = "rgba(255,244,214,0.2)";
      context.lineWidth = Math.max(0.45, bandHeight * 0.055);
      for (let filament = 1; filament <= 3; filament += 1) {
        const filamentY = bandY + (bandHeight * filament) / 4;
        context.beginPath();
        context.moveTo(x, filamentY);
        context.lineTo(x + bandWidth, filamentY);
        context.stroke();
      }
    }
  }

  if (glow && visibleRows > 0 && visibleRows < rows) {
    const edgeY = visibleRows * cellHeight;
    const gradient = context.createLinearGradient(0, edgeY - cellHeight, 0, edgeY + cellHeight);
    gradient.addColorStop(0, "rgba(214,164,88,0)");
    gradient.addColorStop(0.48, "rgba(214,164,88,0.55)");
    gradient.addColorStop(0.52, "rgba(255,238,190,0.95)");
    gradient.addColorStop(1, "rgba(214,164,88,0)");
    context.fillStyle = gradient;
    context.fillRect(0, edgeY - cellHeight, innerWidth, cellHeight * 2);
  }
  context.restore();
}

export function paintActiveWeft(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  row: number,
  rows: number,
  progress: number,
  direction: "ltr" | "rtl",
): void {
  context.clearRect(0, 0, width, height);
  const rowHeight = height / rows;
  const y = row * rowHeight + rowHeight * 0.5;
  const length = width * progress;
  const start = direction === "ltr" ? 0 : width;
  const end = direction === "ltr" ? length : width - length;
  context.save();
  context.strokeStyle = "rgba(255, 226, 153, 0.96)";
  context.shadowColor = "rgba(214, 164, 88, 0.95)";
  context.shadowBlur = 18;
  context.lineWidth = Math.max(2, rowHeight * 0.2);
  context.beginPath();
  context.moveTo(start, y);
  context.lineTo(end, y);
  context.stroke();
  context.restore();
}
