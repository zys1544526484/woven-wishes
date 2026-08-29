import { useState } from "react";
import { getCraftTip } from "../content/craftTips";
import { collaborationSummary } from "../content/collaboration";
import { CRAFT_FACT_EN, CRAFT_FACT_ZH, EXPERIENCE_DISCLAIMER_EN, EXPERIENCE_DISCLAIMER_ZH, INTENT_COPY } from "../content/project";
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
  const intent = INTENT_COPY[primaryIntent];
  const secondaryIntent = proposal.secondaryIntent && proposal.secondaryIntent !== primaryIntent
    ? INTENT_COPY[proposal.secondaryIntent]
    : undefined;
  const craftTip = getCraftTip(recipe.seed);
  const palette = PALETTES[recipe.palette];
  const collaboration = collaborationSummary(locale, weaveMode);

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
          <div className="pattern-annotation pattern-annotation--border"><i /><span>{locale === "zh" ? "连续边饰" : "Continuous border"}</span></div>
        </div>
        <article className="result-copy">
          <h1>{locale === "zh" ? "你织成了一幅" : "You have woven"}<em>「{locale === "zh" ? proposal.titleZh : proposal.titleEn}」</em></h1>
          <blockquote>“{wish}”</blockquote>
          <OrnamentalRule />
          <div className="meaning-share-row">
            <div className="meaning-story">
              <h3>{locale === "zh" ? "为什么是这幅纹样？" : "Why this pattern?"}</h3>
              <p className="ai-reading">
                <span>{locale === "zh" ? "AI读懂" : "AI understands"}</span>
                <strong>
                  {locale === "zh"
                    ? `主要心意：${intent.nameZh}${secondaryIntent ? ` · 也听见：${secondaryIntent.nameZh}` : ""}`
                    : `Main feeling: ${intent.nameEn}${secondaryIntent ? ` · Also heard: ${secondaryIntent.nameEn}` : ""}`}
                </strong>
              </p>
              <p className="choice-result"><span>{locale === "zh" ? "你定稿" : "You chose"}</span><strong>{locale === "zh" ? proposal.titleZh : proposal.titleEn} · {locale === "zh" ? palette.nameZh : palette.nameEn}</strong></p>
              <p className="co-weave-result"><span>{locale === "zh" ? "共同完成" : "Co-woven as"}</span><strong>{collaboration}</strong></p>
              <p>{locale === "zh" ? proposal.rationaleZh : proposal.rationaleEn}</p>
              <p className="culture-boundary">{locale === "zh" ? proposal.culturalBoundaryZh : proposal.culturalBoundaryEn}</p>
              <aside className="craft-tip" data-tip-id={craftTip.id}>
                <span>{locale === "zh" ? "云锦一梭知" : "A Yunjin Note"}</span>
                <strong>{locale === "zh" ? craftTip.titleZh : craftTip.titleEn}</strong>
                <p>{locale === "zh" ? craftTip.bodyZh : craftTip.bodyEn}</p>
              </aside>
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
      <div className="craft-fact">{locale === "zh" ? CRAFT_FACT_ZH : CRAFT_FACT_EN}</div>
      <div className="result-disclaimer">{locale === "zh" ? EXPERIENCE_DISCLAIMER_ZH : EXPERIENCE_DISCLAIMER_EN}</div>
    </section>
  );
}
