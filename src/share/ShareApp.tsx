import { useEffect, useState } from "react";
import { payloadFromLocationHash } from "../core/codec";
import { generatePatternMatrix } from "../core/pattern";
import type { SharePayload } from "../core/types";
import { EXPERIENCE_DISCLAIMER_EN, EXPERIENCE_DISCLAIMER_ZH, PROJECT_TITLE_EN, PROJECT_TITLE_ZH } from "../content/project";
import { PALETTES } from "../content/motifs";
import { proposalFromRecipe } from "../content/proposals";
import { WeaveCanvas } from "../render/WeaveCanvas";
import { createQrDataUrl } from "../render/qr";
import { createResultCardBlob, downloadBlob } from "../render/resultCard";
import { DownloadIcon } from "../app/icons";

function readPayload(): SharePayload | null {
  try { return payloadFromLocationHash(window.location.hash); }
  catch { return null; }
}

export function ShareApp() {
  const [payload, setPayload] = useState(readPayload);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const update = () => setPayload(readPayload());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  if (!payload) {
    const zh = navigator.language.toLowerCase().startsWith("zh");
    return <main className="share-error"><h1>{zh ? "锦愿链接无效" : "Invalid woven-wish link"}</h1><p>{zh ? "请回到展项重新生成一份锦愿。" : "Please return to the installation and create a new result."}</p></main>;
  }
  const matrix = generatePatternMatrix(payload.recipe);
  const palette = PALETTES[payload.recipe.palette];
  const authoredPayload = payload.codecVersion === 2 || payload.codecVersion === 3;
  const proposalId = authoredPayload ? payload.proposalId : "A";
  const weaveMode = authoredPayload ? payload.weaveMode : "player-weaver";
  const proposal = proposalFromRecipe(proposalId, payload.primaryIntent, payload.recipe, payload.secondaryIntent);
  const zh = payload.locale === "zh";

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const qrDataUrl = await createQrDataUrl(window.location.href);
      const blob = await createResultCardBlob({ wish: payload.wish, locale: payload.locale, primaryIntent: payload.primaryIntent, secondaryIntent: payload.secondaryIntent, matrix, recipe: payload.recipe, proposalId, weaveMode, qrDataUrl });
      downloadBlob(blob, `锦愿-${payload.recipe.seed.toString(16)}.png`);
    } finally { setSaving(false); }
  };

  return (
    <main className="share-page" lang={zh ? "zh-CN" : "en"}>
      <header><span>{zh ? PROJECT_TITLE_ZH : PROJECT_TITLE_EN}</span></header>
      <section className="share-pattern"><WeaveCanvas matrix={matrix} palette={palette} recipe={payload.recipe} completedRows={24} locale={payload.locale} /></section>
      <section className="share-copy">
        <p className="share-label">{zh ? "你织成了一幅" : "You have woven"}</p>
        <h2>「{zh ? proposal.titleZh : proposal.titleEn}」</h2>
        <h1>“{payload.wish}”</h1>
        <div className="share-rule" />
        <h3>{zh ? "纹样寓意" : "Meaning"}</h3>
        <p className="share-intent">{zh ? proposal.rationaleZh : proposal.rationaleEn}</p>
        <button type="button" onClick={save} disabled={saving}><DownloadIcon /><span>{zh ? (saving ? "正在生成" : "保存锦愿卡") : (saving ? "Generating" : "Save Wish Card")}</span></button>
      </section>
      <footer><small>{zh ? EXPERIENCE_DISCLAIMER_ZH : EXPERIENCE_DISCLAIMER_EN}</small></footer>
    </main>
  );
}
