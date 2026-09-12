import { EXPERIENCE_DISCLAIMER_EN, EXPERIENCE_DISCLAIMER_ZH, PROJECT_TITLE_EN, PROJECT_TITLE_ZH } from "../content/project";
import { PALETTES } from "../content/motifs";
import { proposalFromRecipe } from "../content/proposals";
import type { IntentId, Locale, PatternMatrix, PatternRecipe, ProposalId, WeaveMode } from "../core/types";
import { imageFromDataUrl } from "./qr";
import { loadMotifAtlas, paintRefinedPattern } from "./refinedPattern";

interface ResultCardOptions {
  wish: string;
  locale: Locale;
  primaryIntent: IntentId;
  secondaryIntent?: IntentId;
  matrix: PatternMatrix;
  recipe: PatternRecipe;
  proposalId: ProposalId;
  weaveMode: WeaveMode;
  qrDataUrl: string;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const characters = (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*|\s+|./gu) ?? [])
    .flatMap(token => context.measureText(token).width > maxWidth ? Array.from(token) : [token]);
  const lines: string[] = [];
  let line = "";
  for (const character of characters) {
    const candidate = line + character;
    if (context.measureText(candidate).width > maxWidth && line && !/^[，。！？；：、,.!?;:]$/.test(character)) {
      lines.push(line.trimEnd());
      line = character.trimStart();
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
  const proposal = proposalFromRecipe(options.proposalId, options.primaryIntent, options.recipe, options.secondaryIntent);
  const motifAtlas = await loadMotifAtlas();

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
  context.fillText(options.locale === "zh" ? PROJECT_TITLE_ZH : PROJECT_TITLE_EN, 72, 86);
  context.font = '400 25px Inter, "Microsoft YaHei", sans-serif';
  context.fillText(options.locale === "zh" ? "你的锦愿" : "Your Woven Wish", 72, 128);

  context.save();
  context.strokeStyle = "rgba(214,164,88,.68)";
  context.lineWidth = 3;
  context.strokeRect(72, 170, 936, 610);
  context.clip(new Path2D("M72 170H1008V780H72Z"));
  context.translate(72, 170);
  paintRefinedPattern(context, motifAtlas, options.recipe, palette, 936, 610, { completedRows: 24, glow: false });
  context.restore();

  context.fillStyle = "#D6A458";
  context.font = '500 27px Inter, "Microsoft YaHei", sans-serif';
  context.fillText(options.locale === "zh" ? "你织成了一幅" : "You have woven", 72, 842);
  context.fillStyle = "#F0DFC0";
  context.font = '600 43px "Noto Serif SC", "Microsoft YaHei", serif';
  context.fillText(`「${options.locale === "zh" ? proposal.titleZh : proposal.titleEn}」`, 72, 899);

  context.fillStyle = "#E8CA91";
  context.font = '500 31px "Microsoft YaHei", "PingFang SC", sans-serif';
  const wishLines = wrapText(context, `“${options.wish}”`, 650);
  let cursorY = drawTextLines(context, wishLines.slice(0, 2), 72, 952, 46);
  cursorY += 18;

  context.fillStyle = "#D6A458";
  context.font = '500 24px Inter, "Microsoft YaHei", sans-serif';
  context.fillText(options.locale === "zh" ? "纹样寓意" : "Meaning", 72, cursorY);
  cursorY += 42;

  context.fillStyle = "#F0DFC0";
  context.font = '500 28px Inter, "Microsoft YaHei", sans-serif';
  drawTextLines(context, wrapText(context, options.locale === "zh" ? proposal.rationaleZh : proposal.rationaleEn, 650), 72, cursorY, 39);

  const qrImage = await imageFromDataUrl(options.qrDataUrl);
  context.fillStyle = "#fffdf7";
  context.fillRect(770, 858, 238, 238);
  context.drawImage(qrImage, 781, 869, 216, 216);
  context.fillStyle = "#D6A458";
  context.font = '500 18px Inter, "Microsoft YaHei", sans-serif';
  context.textAlign = "center";
  context.fillText(options.locale === "zh" ? "扫码带走这份锦愿" : "Scan to keep this wish", 889, 1125);
  context.textAlign = "left";

  context.strokeStyle = "rgba(214,164,88,.35)";
  context.beginPath();
  context.moveTo(72, 1194);
  context.lineTo(1008, 1194);
  context.stroke();
  context.fillStyle = "#D6A458";
  context.font = '500 18px Inter, "Microsoft YaHei", sans-serif';
  context.fillStyle = "#9A8F7A";
  context.font = '400 14px Inter, "Microsoft YaHei", sans-serif';
  drawTextLines(context, wrapText(context, options.locale === "zh" ? EXPERIENCE_DISCLAIMER_ZH : EXPERIENCE_DISCLAIMER_EN, 936).slice(0, 2), 72, 1390, 19);

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
