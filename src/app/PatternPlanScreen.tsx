import { useMemo } from "react";
import { PALETTES } from "../content/motifs";
import { INTENT_COPY, localized } from "../content/project";
import { generatePatternMatrix } from "../core/pattern";
import type { Locale, PatternProposal, WishAnalysis } from "../core/types";
import { WeaveCanvas } from "../render/WeaveCanvas";
import { ArrowIcon } from "./icons";
import { Brand, Disclaimer, ExitButton, OrnamentalRule, SoundToggle } from "./common";

interface PatternPlanScreenProps {
  locale: Locale;
  wish: string;
  analysis: WishAnalysis;
  proposals: PatternProposal[];
  selectedIndex: number;
  planChosen: boolean;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onExit: () => void;
  onSelectCandidate: (index: number) => void;
  onConfirm: () => void;
}

const LAYOUT_NAMES = {
  continuous: { zh: "绵延式", en: "Continuous" },
  roundel: { zh: "向心式", en: "Centred" },
  scattered: { zh: "疏落式", en: "Scattered" },
  combined: { zh: "合景式", en: "Combined" },
} as const;

export function PatternPlanScreen(props: PatternPlanScreenProps) {
  const selectedIntent = INTENT_COPY[props.analysis.primaryIntent];
  const secondaryIntent = props.analysis.secondaryIntent ? INTENT_COPY[props.analysis.secondaryIntent] : undefined;
  const previews = useMemo(() => props.proposals.map((proposal) => ({
    proposal,
    recipe: proposal.recipe,
    matrix: generatePatternMatrix(proposal.recipe),
  })), [props.proposals]);
  const chosenProposal = props.proposals[props.selectedIndex];

  return (
    <section className="screen plan-screen" lang={props.locale === "zh" ? "zh-CN" : "en"}>
      <header className="weaving-header plan-header">
        <Brand locale={props.locale} compact />
        <h1>{localized(props.locale, "选择你的纹样方案", "Choose Your Motif Proposal")}</h1>
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
            "AI只提出三种纹样方向。你先定主纹与构图，彩纬将在织造中亲自选择。",
            "AI proposes three motif directions. You choose the motif and layout now, then choose coloured wefts while weaving.",
          )}</p>
        </aside>

        <main className="plan-choice-main">
          <div className="candidate-heading">
            <div>
              <span>{localized(props.locale, "三张提案", "Three proposals")}</span>
              <strong>{localized(props.locale, "先定纹样，再转成花本提示", "Choose a motif, then translate it into pattern cues")}</strong>
            </div>
            <small className={props.planChosen ? "is-chosen" : "is-awaiting"} role="status">
              {props.planChosen && chosenProposal
                ? localized(props.locale, `你选择了 ${chosenProposal.titleZh}`, `You chose ${chosenProposal.titleEn}`)
                : localized(props.locale, "请亲自点选 A、B 或 C", "Choose A, B or C yourself")}
            </small>
          </div>

          <div className="candidate-row" role="radiogroup" aria-label={localized(props.locale, "纹样方案", "Motif proposals")}>
            {previews.map(({ proposal, recipe, matrix }, index) => {
              const layoutName = LAYOUT_NAMES[recipe.layout];
              const selected = index === props.selectedIndex;
              const chosen = selected && props.planChosen;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  className={`candidate-option${chosen ? " is-selected" : selected ? " is-previewed" : ""}`}
                  key={proposal.id}
                  onClick={() => props.onSelectCandidate(index)}
                >
                  <div className="candidate-preview">
                    <WeaveCanvas matrix={matrix} palette={PALETTES[recipe.palette]} recipe={recipe} completedRows={24} locale={props.locale} />
                    {chosen ? <span className="candidate-check" aria-hidden="true">✓</span> : null}
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

          <button type="button" className="plan-confirm-action" disabled={!props.planChosen} onClick={props.onConfirm}>
            <span>{props.planChosen && chosenProposal
              ? localized(props.locale, `采用「${chosenProposal.titleZh}」`, `Use “${chosenProposal.titleEn}”`)
              : localized(props.locale, "先选择一张纹样方案", "Choose a Motif Proposal First")}</span>
            <ArrowIcon />
          </button>
        </main>
      </div>
      <Disclaimer locale={props.locale} />
    </section>
  );
}
