import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Diagnostic server only; the user preview stays on 4173.
const output = join(tmpdir(), 'woven-wishes-render-audit');
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 0, open: false } });
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 2000 } });
  await page.route('**/render-audit', route => route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }));
  await page.goto(`${server.resolvedUrls.local[0]}render-audit`);
  const report = await page.evaluate(async () => {
    const { loadMotifAtlas, paintRefinedPattern, MOTIF_ATLAS_REGIONS } = await import('/src/render/refinedPattern.ts');
    const { PALETTES } = await import('/src/content/motifs.ts');
    const atlas = await loadMotifAtlas();
    document.body.style.cssText = 'margin:0;background:#020c18;color:#f0dfc0;font:16px sans-serif';
    const issues = [];
    let checked = 0;
    for (const goldTreatment of ['outline', 'centre']) {
      const grid = document.createElement('section');
      grid.id = goldTreatment;
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,400px)';
      document.body.append(grid);
      for (const primaryMotif of Object.keys(MOTIF_ATLAS_REGIONS)) {
        for (const palette of Object.values(PALETTES)) {
          const tile = document.createElement('div');
          const label = document.createElement('div');
          label.textContent = `${primaryMotif} / ${palette.nameZh} / ${goldTreatment}`;
          tile.append(label);
          const canvas = document.createElement('canvas');
          canvas.width = 400; canvas.height = 260; tile.append(canvas); grid.append(tile);
          const context = canvas.getContext('2d');
          for (const layout of ['roundel', 'continuous', 'scattered', 'combined']) {
            for (const borderTreatment of ['continuous', 'balanced']) {
              const recipe = {version:1,seed:231,rows:24,columns:48,primaryMotif,palette:palette.id,layout,goldTreatment,borderTreatment};
              paintRefinedPattern(context, atlas, recipe, palette, 400, 260, {completedRows:24,glow:false});
              const pixels = context.getImageData(60,45,280,170).data;
              let bright = 0;
              for(let i=0;i<pixels.length;i+=4) if(Math.max(pixels[i],pixels[i+1],pixels[i+2])>125) bright++;
              if(bright < 100) issues.push({primaryMotif,palette:palette.id,layout,goldTreatment,borderTreatment,bright});
              checked++;
            }
          }
          paintRefinedPattern(context, atlas, {version:1,seed:231,rows:24,columns:48,primaryMotif,palette:palette.id,layout:'roundel',goldTreatment,borderTreatment:'continuous'}, palette,400,260,{completedRows:24,glow:false});
        }
      }
    }
    return {checked,issues};
  });
  for(const treatment of ['outline','centre']) await page.locator(`#${treatment}`).screenshot({path:join(output,`${treatment}.png`)});
  const examples = await page.evaluate(async () => {
    const { composePatternProposals, generatePatternMatrix } = await import('/src/core/pattern.ts');
    const { createResultCardBlob } = await import('/src/render/resultCard.ts');
    const { createQrDataUrl } = await import('/src/render/qr.ts');
    const { encodeSharePayload } = await import('/src/core/codec.ts');
    const cards = [];
    for(const primaryIntent of ['safety','reunion','courage','abundance','joy','longevity']) {
      const proposals = composePatternProposals({primaryIntent,scores:{[primaryIntent]:1},confidence:1,fallback:false,seed:231,modelVersion:'audit'});
      for(const proposal of proposals) {
        const recipe = {...proposal.recipe,goldTreatment:'centre',borderTreatment:'balanced'};
        for(const locale of ['zh','en']) {
          const wish = locale === 'zh' ? '愿四季丰足，耕耘有收获' : 'May our loved ones find peace and joy every day';
          const payload = {codecVersion:3,recipe,locale,wish,primaryIntent,proposalId:proposal.id,weaveMode:'player-weaver'};
          const fragment = `r=${encodeSharePayload(payload)}`;
          const qrDataUrl = await createQrDataUrl(`${location.origin}/share.html#${fragment}`);
          const blob = await createResultCardBlob({...payload,matrix:generatePatternMatrix(recipe),qrDataUrl});
          const bitmap = await createImageBitmap(blob);
          if(bitmap.width !== 1080 || bitmap.height !== 1440) throw new Error('Wrong card dimensions');
          bitmap.close();
          const data = await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);});
          cards.push({name:`${primaryIntent}-${proposal.id}-${locale}`,data,fragment});
        }
      }
    }
    return cards;
  });
  for(const card of examples) await writeFile(join(output,`${card.name}.png`),Buffer.from(card.data.split(',')[1],'base64'));
  for(const locale of ['zh','en']) {
    const card = examples.find(card=>card.name===`abundance-C-${locale}`);
    await page.setViewportSize({width:390,height:844});
    await page.goto(`${server.resolvedUrls.local[0]}share.html#${card.fragment}`);
    await page.locator(`.share-page[lang="${locale === 'zh' ? 'zh-CN' : 'en'}"]`).waitFor();
    await page.locator('.share-pattern canvas').first().waitFor();
    await page.waitForTimeout(700);
    await page.screenshot({path:join(output,`share-${locale}.png`),fullPage:true});
    const text=await page.locator('.share-copy').innerText();
    if(/AI读懂|你亲自决定|云锦一梭知|AI understands|You decided|A Yunjin Note/.test(text)) throw new Error('Verbose share copy remains');
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw new Error('Share page overflow');
    await page.locator('.share-copy button').scrollIntoViewIfNeeded();
    const button = await page.locator('.share-copy button').boundingBox();
    if(!button || button.y < -1 || button.y + button.height > 845) throw new Error(`Share save button is unreachable: ${JSON.stringify(button)}`);
  }
  console.log(`Verified ${examples.length} cards and Chinese/English mobile share pages`);
  console.log(JSON.stringify({ ...report, output }, null, 2));
  if(report.issues.length) process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
