import { useState } from "react";
import { CRAFT_FACT_ZH, EXPERIENCE_DISCLAIMER_ZH, INTENT_COPY } from "../content/project";
import { MOTIFS, PALETTES } from "../content/motifs";
import type { IntentId, Locale, PatternMatrix, PatternRecipe } from "../core/types";
import { WeaveCanvas } from "../render/WeaveCanvas";
import { createResultCardBlob, downloadBlob } from "../render/resultCard";
import { Brand, OrnamentalRule } from "./common";
import { DownloadIcon, RestartIcon } from "./icons";

interface ResultScreenProps {
  locale: Locale;
  wish: string;
  primaryIntent: IntentId;
  matrix: PatternMatrix;
  recipe: PatternRecipe;
  qrDataUrl: string;
  shareUrl: string;
  onRestart: () => void;
}

export function ResultScreen({ locale, wish, primaryIntent, matrix, recipe, qrDataUrl, shareUrl, onRestart }: ResultScreenProps) {
  const [saving, setSaving] = useState(false);
  const intent = INTENT_COPY[primaryIntent];
  const primary = MOTIFS[recipe.primaryMotif];
  const secondary = recipe.secondaryMotif ? MOTIFS[recipe.secondaryMotif] : undefined;
  const palette = PALETTES[recipe.palette];

  const save = async () => {
    if (!qrDataUrl || saving) return;
    setSaving(true);
    try {
      const blob = await createResultCardBlob({ wish, locale, primaryIntent, matrix, recipe, qrDataUrl });
      downloadBlob(blob, `锦愿-${primaryIntent}-${recipe.seed.toString(16)}.png`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="screen result-screen">
      <header className="result-header"><Brand compact /><div>你的锦愿 / Your Woven Wish</div><span /></header>
      <div className="result-layout">
        <div className="result-pattern-frame"><WeaveCanvas matrix={matrix} palette={palette} completedRows={24} /></div>
        <article className="result-copy">
          <blockquote>“{wish}”</blockquote>
          <p className="result-english">{locale === "zh" ? intent.planEn : intent.planZh}</p>
          <OrnamentalRule />
          <p className="ai-note">AI从经考据的纹样与色彩规则中，为这句心愿生成一幅当代数字锦样。</p>
          <div className="meaning-share-row">
            <div className="meaning-list">
              <h3>纹样寓意 / Motif Meaning</h3>
              <div><span>◉</span><p><b>{primary.nameZh}</b>{primary.contemporaryMappingZh}</p></div>
              {secondary ? <div><span>◇</span><p><b>{secondary.nameZh}</b>{secondary.contemporaryMappingZh}</p></div> : null}
              <div><span>◌</span><p><b>{palette.nameZh}</b>当代数字配色，不宣称固定历史色彩寓意。</p></div>
            </div>
            <div className="qr-block">
              {qrDataUrl ? <img src={qrDataUrl} data-share-url={shareUrl} alt="锦愿分享二维码" /> : <div className="qr-loading">生成中</div>}
              <span>扫码带走锦愿<br /><small>Scan to save</small></span>
            </div>
          </div>
          <div className="result-actions">
            <button type="button" className="secondary-action" onClick={onRestart}><RestartIcon /><span>再织一次<small>Weave Again</small></span></button>
            <button type="button" className="save-action" onClick={save} disabled={saving || !qrDataUrl}><DownloadIcon /><span>{saving ? "正在保存" : "保存锦愿"}<small>Save</small></span></button>
          </div>
        </article>
      </div>
      <div className="craft-fact">{CRAFT_FACT_ZH}</div>
      <div className="result-disclaimer">{EXPERIENCE_DISCLAIMER_ZH}</div>
    </section>
  );
}
