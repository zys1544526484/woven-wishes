import { useState } from "react";
import { EXPERIENCE_DISCLAIMER_EN, EXPERIENCE_DISCLAIMER_ZH } from "../content/project";
import { PALETTES } from "../content/motifs";
import type { IntentId, Locale, PatternMatrix, PatternProposal, PatternRecipe, WeaveMode } from "../core/types";
import { WeaveCanvas } from "../render/WeaveCanvas";
import { createResultCardBlob, downloadBlob } from "../render/resultCard";
import { Brand, OrnamentalRule, SoundToggle } from "./common";
import { DownloadIcon, RestartIcon } from "./icons";

interface ResultScreenProps {
  locale: Locale;
  wish: string;
  primaryIntent: IntentId;
  matrix: PatternMatrix;
  recipe: PatternRecipe;
  proposal: PatternProposal;
  qrDataUrl: string;
  shareUrl: string;
  weaveMode: WeaveMode;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onRestart: () => void;
}

export function ResultScreen({ locale, wish, primaryIntent, matrix, recipe, proposal, qrDataUrl, shareUrl, weaveMode, soundEnabled, onSoundToggle, onRestart }: ResultScreenProps) {
  const [saving, setSaving] = useState(false);
  const palette = PALETTES[recipe.palette];

  const save = async () => {
    if (!qrDataUrl || saving) return;
    setSaving(true);
    try {
      const blob = await createResultCardBlob({ wish, locale, primaryIntent, secondaryIntent: proposal.secondaryIntent, matrix, recipe, proposalId: proposal.id, weaveMode, qrDataUrl });
      downloadBlob(blob, `锦愿-${primaryIntent}-${recipe.seed.toString(16)}.png`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="screen result-screen" lang={locale === "zh" ? "zh-CN" : "en"}>
      <header className="result-header">
        <Brand locale={locale} compact />
        <div>{locale === "zh" ? "你的锦愿" : "Your Woven Wish"}</div>
        <SoundToggle locale={locale} enabled={soundEnabled} onToggle={onSoundToggle} />
      </header>
      <div className="result-layout">
        <div className="result-pattern-frame">
          <WeaveCanvas matrix={matrix} palette={palette} recipe={recipe} completedRows={24} locale={locale} />
          <div className="pattern-annotation pattern-annotation--primary"><span>{locale === "zh" ? proposal.titleZh : proposal.titleEn}</span><i /></div>
          <div className="pattern-annotation pattern-annotation--border"><i /><span>{recipe.borderTreatment === "balanced"
            ? (locale === "zh" ? "对称边饰" : "Balanced border")
            : (locale === "zh" ? "连续边饰" : "Continuous border")}</span></div>
        </div>
        <article className="result-copy">
          <h1>{locale === "zh" ? "你织成了一幅" : "You have woven"}<em>「{locale === "zh" ? proposal.titleZh : proposal.titleEn}」</em></h1>
          <blockquote>“{wish}”</blockquote>
          <OrnamentalRule />
          <div className="meaning-share-row">
            <div className="meaning-story">
              <h3>{locale === "zh" ? "为什么是这幅纹样？" : "Why this pattern?"}</h3>
              <p>{locale === "zh" ? proposal.rationaleZh : proposal.rationaleEn}</p>
              <h3>{locale === "zh" ? "纹样寓意" : "Meaning"}</h3>
              <p className="culture-boundary">{locale === "zh" ? proposal.culturalBoundaryZh : proposal.culturalBoundaryEn}</p>
            </div>
            <div className="qr-block">
              {qrDataUrl ? <img src={qrDataUrl} data-share-url={shareUrl} alt={locale === "zh" ? "锦愿分享二维码" : "Woven wish sharing QR code"} /> : <div className="qr-loading">{locale === "zh" ? "生成中" : "Generating"}</div>}
              <span>{locale === "zh" ? "扫码带走这份锦愿" : "Scan to keep this wish"}</span>
            </div>
          </div>
          <div className="result-actions">
            <button type="button" className="secondary-action" onClick={onRestart}><RestartIcon /><span>{locale === "zh" ? "再织一次" : "Weave Again"}</span></button>
            <button type="button" className="save-action" onClick={save} disabled={saving || !qrDataUrl}><DownloadIcon /><span>{locale === "zh" ? (saving ? "正在保存" : "保存锦愿") : (saving ? "Saving" : "Save Wish")}</span></button>
          </div>
        </article>
      </div>
      <div className="result-disclaimer">{locale === "zh" ? EXPERIENCE_DISCLAIMER_ZH : EXPERIENCE_DISCLAIMER_EN}</div>
    </section>
  );
}
