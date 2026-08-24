import { INTENT_COPY, CRAFT_FACT_EN, CRAFT_FACT_ZH, EXPERIENCE_DISCLAIMER_EN, EXPERIENCE_DISCLAIMER_ZH } from "../content/project";
import { MOTIFS, PALETTES } from "../content/motifs";
import type { IntentId, Locale, PatternMatrix, PatternRecipe } from "../core/types";
import { imageFromDataUrl } from "./qr";
import { paintWovenMatrix } from "./weavePainter";

interface ResultCardOptions {
  wish: string;
  locale: Locale;
  primaryIntent: IntentId;
  matrix: PatternMatrix;
  recipe: PatternRecipe;
  qrDataUrl: string;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const characters = Array.from(text);
  const lines: string[] = [];
  let line = "";
  for (const character of characters) {
    const candidate = line + character;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = character;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

function drawTextLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
): number {
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

export async function createResultCardBlob(options: ResultCardOptions): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  const palette = PALETTES[options.recipe.palette];
  const intent = INTENT_COPY[options.primaryIntent];
  const motif = MOTIFS[options.recipe.primaryMotif];

  context.fillStyle = "#020C18";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const background = context.createRadialGradient(540, 360, 30, 540, 500, 720);
  background.addColorStop(0, "rgba(8,116,124,.2)");
  background.addColorStop(0.55, "rgba(214,164,88,.04)");
  background.addColorStop(1, "rgba(2,12,24,0)");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#D6A458";
  context.font = '600 42px "Noto Serif SC", "Microsoft YaHei", serif';
  context.fillText("一日六厘米", 72, 86);
  context.font = '400 25px Inter, "Microsoft YaHei", sans-serif';
  context.fillText("你的锦愿 / Your Woven Wish", 72, 128);

  context.save();
  context.strokeStyle = "rgba(214,164,88,.68)";
  context.lineWidth = 3;
  context.strokeRect(72, 170, 936, 610);
  context.clip(new Path2D("M72 170H1008V780H72Z"));
  context.translate(72, 170);
  paintWovenMatrix(context, options.matrix, palette, 936, 610, { completedRows: 24, glow: false });
  context.restore();

  context.fillStyle = "#F0DFC0";
  context.font = '600 40px "Microsoft YaHei", "PingFang SC", sans-serif';
  const wishLines = wrapText(context, `“${options.wish}”`, 670);
  let cursorY = drawTextLines(context, wishLines.slice(0, 2), 72, 850, 58);

  context.fillStyle = "#D6A458";
  context.font = '500 25px Inter, "Microsoft YaHei", sans-serif';
  context.fillText(options.locale === "zh" ? "纹样寓意 / Motif Meaning" : "Motif Meaning / 纹样寓意", 72, cursorY + 20);
  cursorY += 67;

  context.fillStyle = "#F0DFC0";
  context.font = '400 24px Inter, "Microsoft YaHei", sans-serif';
  cursorY = drawTextLines(context, wrapText(context, options.locale === "zh" ? motif.contemporaryMappingZh : motif.contemporaryMappingEn, 660), 72, cursorY, 38);
  cursorY += 16;
  context.fillStyle = "#9A8F7A";
  context.font = '400 20px Inter, "Microsoft YaHei", sans-serif';
  drawTextLines(context, wrapText(context, options.locale === "zh" ? intent.resultZh : intent.resultEn, 660), 72, cursorY, 32);

  const qrImage = await imageFromDataUrl(options.qrDataUrl);
  context.fillStyle = "#fffdf7";
  context.fillRect(760, 846, 248, 248);
  context.drawImage(qrImage, 772, 858, 224, 224);
  context.fillStyle = "#D6A458";
  context.font = '500 18px Inter, "Microsoft YaHei", sans-serif';
  context.textAlign = "center";
  context.fillText("扫码带走锦愿 · Scan to save", 884, 1126);
  context.textAlign = "left";

  context.strokeStyle = "rgba(214,164,88,.35)";
  context.beginPath();
  context.moveTo(72, 1194);
  context.lineTo(1008, 1194);
  context.stroke();
  context.fillStyle = "#F0DFC0";
  context.font = '400 19px Inter, "Microsoft YaHei", sans-serif';
  drawTextLines(context, wrapText(context, options.locale === "zh" ? CRAFT_FACT_ZH : CRAFT_FACT_EN, 936), 72, 1240, 31);
  context.fillStyle = "#9A8F7A";
  context.font = '400 17px Inter, "Microsoft YaHei", sans-serif';
  drawTextLines(context, wrapText(context, options.locale === "zh" ? EXPERIENCE_DISCLAIMER_ZH : EXPERIENCE_DISCLAIMER_EN, 936), 72, 1354, 26);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Unable to export result card"))), "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
