import { useMemo, useState } from "react";
import { payloadFromLocationHash } from "../core/codec";
import { generatePatternMatrix } from "../core/pattern";
import type { SharePayload } from "../core/types";
import { collaborationSummary, treatmentSummary } from "../content/collaboration";
import { getCraftTip } from "../content/craftTips";
import { CRAFT_FACT_EN, CRAFT_FACT_ZH, EXPERIENCE_DISCLAIMER_EN, EXPERIENCE_DISCLAIMER_ZH, INTENT_COPY, PROJECT_TITLE_EN, PROJECT_TITLE_ZH } from "../content/project";
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
  const payload = useMemo(readPayload, []);
  const [saving, setSaving] = useState(false);
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
  const craftTip = getCraftTip(payload.recipe.seed);
  const intent = INTENT_COPY[payload.primaryIntent];
  const secondaryIntent = payload.secondaryIntent && payload.secondaryIntent !== payload.primaryIntent
    ? INTENT_COPY[payload.secondaryIntent]
    : undefined;
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
        <h3>
          {zh
            ? `AI读懂：主要心意 ${intent.nameZh}${secondaryIntent ? ` · 也听见 ${secondaryIntent.nameZh}` : ""}`
            : `AI understands: main feeling ${intent.nameEn}${secondaryIntent ? ` · also heard ${secondaryIntent.nameEn}` : ""}`}
        </h3>
        <p className="share-choice">{zh ? "你亲自决定：" : "You decided: "}{zh ? proposal.titleZh : proposal.titleEn} · {zh ? palette.nameZh : palette.nameEn}{treatmentSummary(payload.locale, payload.recipe) ? ` · ${treatmentSummary(payload.locale, payload.recipe)}` : ""}</p>
        <p className="share-collaboration">{zh ? "共同完成：" : "Co-woven as: "}{collaborationSummary(payload.locale, weaveMode)}</p>
        <p>{zh ? proposal.rationaleZh : proposal.rationaleEn}</p>
        <p className="share-intent">{zh ? proposal.culturalBoundaryZh : proposal.culturalBoundaryEn}</p>
        <aside className="share-craft-tip"><span>{zh ? "云锦一梭知" : "A Yunjin Note"}</span><strong>{zh ? craftTip.titleZh : craftTip.titleEn}</strong><p>{zh ? craftTip.bodyZh : craftTip.bodyEn}</p></aside>
        <button type="button" onClick={save} disabled={saving}><DownloadIcon /><span>{zh ? (saving ? "正在生成" : "保存锦愿卡") : (saving ? "Generating" : "Save Wish Card")}</span></button>
      </section>
      <footer><p>{zh ? CRAFT_FACT_ZH : CRAFT_FACT_EN}</p><small>{zh ? EXPERIENCE_DISCLAIMER_ZH : EXPERIENCE_DISCLAIMER_EN}</small></footer>
    </main>
  );
}
