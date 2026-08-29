import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

const presets = {
  reunion: { button: "团聚", wish: "愿远方的家人早日团聚" },
  safety: { button: "平安", wish: "愿远方的家人平安" },
  courage: { button: "勇气", wish: "愿我们都有重新出发的勇气" },
  abundance: { button: "丰足", wish: "愿四季丰足，耕耘有收获" },
  joy: { button: "喜悦", wish: "愿好消息如约而至" },
  longevity: { button: "长久", wish: "愿岁岁康宁，长久相伴" },
};
const qaIntent = process.env.WOVEN_QA_INTENT ?? "reunion";
const qaVersion = process.env.WOVEN_QA_VERSION ?? "v1.6";
const preset = presets[qaIntent];
if (!preset) throw new Error(`Unknown WOVEN_QA_INTENT: ${qaIntent}`);
const artifactDirectory = resolve("artifacts/qa", qaVersion);
mkdirSync(artifactDirectory, { recursive: true });

await page.goto(pathToFileURL(resolve("dist/index.html")).href);
await page.getByRole("button", { name: preset.button, exact: true }).click();
await page.getByRole("button", { name: /织下这份心愿/ }).click();
await page.getByRole("heading", { name: /选择你的数字花本/ }).waitFor();
await page.locator(".candidate-option").nth(1).click();
await page.getByRole("radio", { name: /金翠大红/ }).click();
await page.getByRole("button", { name: /采用这张数字花本/ }).click();
await page.getByRole("heading", { name: /选择共织方式/ }).waitFor();
await page.getByRole("button", { name: /开始共织/ }).click();
await page.getByRole("heading", { name: preset.wish, exact: true }).waitFor();

let weavingMidScreenshotPath = "";
for (let row = 0; row < 24; row += 1) {
  await page.waitForTimeout(420);
  await page.keyboard.press(row % 2 === 0 ? "ArrowRight" : "ArrowLeft");
  await page.waitForTimeout(480);
  if (row === 11) {
    weavingMidScreenshotPath = resolve(artifactDirectory, `weaving-${qaIntent}-12-passes.png`);
    await page.screenshot({ path: weavingMidScreenshotPath });
  }
}

await page.locator(".result-copy h1").waitFor();
const resultScreenshotPath = resolve(artifactDirectory, `result-${qaIntent}-offline.png`);
await page.screenshot({ path: resultScreenshotPath });
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: /保存锦愿/ }).click();
const download = await downloadPromise;
const outputPath = resolve(artifactDirectory, `wish-card-${qaIntent}.png`);
await download.saveAs(outputPath);

const png = readFileSync(outputPath);
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
const remoteRequests = await page.evaluate(() => performance.getEntriesByType("resource")
  .filter((entry) => entry.name.startsWith("http")).length);

if (width !== 1080 || height !== 1440) throw new Error(`Unexpected PNG dimensions: ${width}x${height}`);
if (errors.length) throw new Error(`Page errors: ${errors.join(" | ")}`);
if (remoteRequests !== 0) throw new Error(`Unexpected remote resource requests: ${remoteRequests}`);

console.log(JSON.stringify({ width, height, remoteRequests, pageErrors: errors.length, outputPath, weavingMidScreenshotPath, resultScreenshotPath }, null, 2));
await browser.close();
