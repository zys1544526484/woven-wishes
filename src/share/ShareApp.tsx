import { useMemo, useState } from "react";
import { payloadFromLocationHash } from "../core/codec";
import { generatePatternMatrix } from "../core/pattern";
import type { SharePayloadV1 } from "../core/types";
import { CRAFT_FACT_EN, CRAFT_FACT_ZH, EXPERIENCE_DISCLAIMER_EN, EXPERIENCE_DISCLAIMER_ZH, INTENT_COPY } from "../content/project";
import { MOTIFS, PALETTES } from "../content/motifs";
import { WeaveCanvas } from "../render/WeaveCanvas";
import { createQrDataUrl } from "../render/qr";
import { createResultCardBlob, downloadBlob } from "../render/resultCard";
import { DownloadIcon } from "../app/icons";

function readPayload(): SharePayloadV1 | null {
  try { return payloadFromLocationHash(window.location.hash); }
  catch { return null; }
}

export function ShareApp() {
  const payload = useMemo(readPayload, []);
  const [saving, setSaving] = useState(false);
  if (!payload) {
    return <main className="share-error"><span>锦愿链接无效</span><h1>Invalid woven-wish link</h1><p>请回到展项重新生成一份锦愿。<br />Please return to the installation and create a new result.</p></main>;
  }
  const matrix = generatePatternMatrix(payload.recipe);
  const palette = PALETTES[payload.recipe.palette];
  const motif = MOTIFS[payload.recipe.primaryMotif];
  const intent = INTENT_COPY[payload.primaryIntent];
  const zh = payload.locale === "zh";

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const qrDataUrl = await createQrDataUrl(window.location.href);
      const blob = await createResultCardBlob({ wish: payload.wish, locale: payload.locale, primaryIntent: payload.primaryIntent, matrix, recipe: payload.recipe, qrDataUrl });
      downloadBlob(blob, `锦愿-${payload.recipe.seed.toString(16)}.png`);
    } finally { setSaving(false); }
  };

  return (
    <main className="share-page">
      <header><span>一日六厘米</span><small>Six Centimetres a Day</small></header>
      <section className="share-pattern"><WeaveCanvas matrix={matrix} palette={palette} completedRows={24} /></section>
      <section className="share-copy">
        <p className="share-label">你的锦愿 / Your Woven Wish</p>
        <h1>“{payload.wish}”</h1>
        <div className="share-rule" />
        <h2>{motif.nameZh} · {motif.nameEn}</h2>
        <p>{zh ? motif.contemporaryMappingZh : motif.contemporaryMappingEn}</p>
        <p className="share-intent">{zh ? intent.resultZh : intent.resultEn}</p>
        <button type="button" onClick={save} disabled={saving}><DownloadIcon /><span>{saving ? "正在生成" : "保存锦愿卡"}<small>Save card</small></span></button>
      </section>
      <footer><p>{zh ? CRAFT_FACT_ZH : CRAFT_FACT_EN}</p><small>{zh ? EXPERIENCE_DISCLAIMER_ZH : EXPERIENCE_DISCLAIMER_EN}</small></footer>
    </main>
  );
}
