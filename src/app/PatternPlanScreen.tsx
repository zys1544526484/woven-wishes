import { useMemo, type CSSProperties } from "react";
import { PALETTES } from "../content/motifs";
import { INTENT_COPY, localized } from "../content/project";
import { generatePatternMatrix } from "../core/pattern";
import type { Locale, PaletteId, PatternProposal, WishAnalysis } from "../core/types";
import { WeaveCanvas } from "../render/WeaveCanvas";
import { ArrowIcon } from "./icons";
import { Brand, Disclaimer, ExitButton, OrnamentalRule, SoundToggle } from "./common";

interface PatternPlanScreenProps {
  locale: Locale;
  wish: string;
  analysis: WishAnalysis;
  proposals: PatternProposal[];
  selectedIndex: number;
  selectedPalette: PaletteId;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onExit: () => void;
  onSelectCandidate: (index: number) => void;
  onSelectPalette: (palette: PaletteId) => void;
  onConfirm: () => void;
}

const LAYOUT_NAMES = {
  continuous: { zh: "绵延式", en: "Continuous" },
  roundel: { zh: "向心式", en: "Centred" },
  scattered: { zh: "疏落式", en: "Scattered" },
  combined: { zh: "合景式", en: "Combined" },
} as const;

const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

export function PatternPlanScreen(props: PatternPlanScreenProps) {
  const selectedIntent = INTENT_COPY[props.analysis.primaryIntent];
  const secondaryIntent = props.analysis.secondaryIntent ? INTENT_COPY[props.analysis.secondaryIntent] : undefined;
  const previews = useMemo(() => props.proposals.map((proposal) => {
    const recipe = { ...proposal.recipe, palette: props.selectedPalette };
    return { proposal, recipe, matrix: generatePatternMatrix(recipe) };
  }), [props.proposals, props.selectedPalette]);

  return (
    <section className="screen plan-screen" lang={props.locale === "zh" ? "zh-CN" : "en"}>
      <header className="weaving-header plan-header">
        <Brand locale={props.locale} compact />
        <h1>{localized(props.locale, "选择你的数字花本", "Choose Your Pattern Plan")}</h1>
        <div className="weaving-status">
          <span>{localized(props.locale, "第 2 步 / 4", "Step 2 / 4")}</span>
          <ExitButton locale={props.locale} onExit={props.onExit} />
          <SoundToggle locale={props.locale} enabled={props.soundEnabled} onToggle={props.onSoundToggle} compact />
        </div>
      </header>

      <div className="plan-choice-layout">
        <aside className="plan-analysis-rail">
          <span className="panel-label">{localized(props.locale, "你的心意", "Your wish")}</span>
          <h2>{props.wish}</h2>
          <OrnamentalRule />
          <div className="intent-reading">
            <small>{localized(props.locale, "AI读懂", "AI understands")}</small>
            <strong>{props.locale === "zh" ? selectedIntent.nameZh : selectedIntent.nameEn}</strong>
            {secondaryIntent ? <span>{localized(props.locale, "也听见", "Also heard")} · {props.locale === "zh" ? secondaryIntent.nameZh : secondaryIntent.nameEn}</span> : null}
          </div>
          <p>{localized(
            props.locale,
            "AI只提出三种数字织法。主纹、构图和彩纬由你亲自定稿。",
            "AI proposes three digital approaches. You make the final choice of motif, layout and colours.",
          )}</p>
        </aside>

        <main className="plan-choice-main">
          <div className="candidate-heading">
            <div>
              <span>{localized(props.locale, "三张提案", "Three proposals")}</span>
              <strong>{localized(props.locale, "先选构图，再选彩纬", "Choose a composition, then its colours")}</strong>
            </div>
            <small>{localized(props.locale, "同一句心愿，每次选择都可复现", "Every choice is reproducible for the same wish")}</small>
          </div>

          <div className="candidate-row" role="radiogroup" aria-label={localized(props.locale, "数字花本提案", "Digital pattern plan proposals")}>
            {previews.map(({ proposal, recipe, matrix }, index) => {
              const layoutName = LAYOUT_NAMES[recipe.layout];
              const selected = index === props.selectedIndex;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`candidate-option${selected ? " is-selected" : ""}`}
                  key={proposal.id}
                  onClick={() => props.onSelectCandidate(index)}
                >
                  <div className="candidate-preview">
                    <WeaveCanvas matrix={matrix} palette={PALETTES[recipe.palette]} recipe={recipe} completedRows={24} locale={props.locale} />
                    {selected ? <span className="candidate-check" aria-hidden="true">✓</span> : null}
                  </div>
                  <span className="candidate-number">{proposal.id}</span>
                  <strong>{props.locale === "zh" ? proposal.titleZh : proposal.titleEn}</strong>
                  <small>{props.locale === "zh" ? layoutName.zh : layoutName.en}</small>
                  <p className="candidate-rationale">{props.locale === "zh" ? proposal.rationaleZh : proposal.rationaleEn}</p>
                  <p className="candidate-boundary">{props.locale === "zh" ? proposal.culturalBoundaryZh : proposal.culturalBoundaryEn}</p>
                </button>
              );
            })}
          </div>

          <div className="palette-choice" role="radiogroup" aria-label={localized(props.locale, "彩纬配色", "Colour palette")}>
            <div className="palette-choice-copy">
              <span>{localized(props.locale, "选择彩纬", "Choose the coloured wefts")}</span>
              <small>{localized(props.locale, "均为本作屏幕配色，不代表传统染色标准", "Digital screen palettes, not traditional dye standards")}</small>
            </div>
            {PALETTE_IDS.map((paletteId) => {
              const palette = PALETTES[paletteId];
              const selected = paletteId === props.selectedPalette;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`palette-option${selected ? " is-selected" : ""}`}
                  key={paletteId}
                  onClick={() => props.onSelectPalette(paletteId)}
                >
                  <i style={{ "--swatch-a": palette.colors[1], "--swatch-b": palette.colors[2], "--swatch-c": palette.colors[3] } as CSSProperties} />
                  <span>{props.locale === "zh" ? palette.nameZh : palette.nameEn}</span>
                </button>
              );
            })}
          </div>

          <button type="button" className="plan-confirm-action" onClick={props.onConfirm}>
            <span>{localized(props.locale, "采用这张数字花本", "Use This Pattern Plan")}</span>
            <ArrowIcon />
          </button>
        </main>
      </div>
      <Disclaimer locale={props.locale} />
    </section>
  );
}
