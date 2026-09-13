import { useState } from "react";
import { PALETTES } from "../content/motifs";
import { localized } from "../content/project";
import type { Locale, PatternMatrix, PatternProposal, PatternRecipe } from "../core/types";
import { WeaveCanvas } from "../render/WeaveCanvas";
import { ArrowIcon } from "./icons";
import { Brand, Disclaimer, ExitButton, SoundToggle } from "./common";

interface PatternCodingScreenProps {
  locale: Locale;
  matrix: PatternMatrix;
  recipe: PatternRecipe;
  proposal: PatternProposal;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onExit: () => void;
  onComplete: () => void;
}

const CODING_STEPS = [
  {
    zh: "确认纹样",
    en: "Confirm the motif",
    detailZh: "先确定主纹与构图",
    detailEn: "Set the motif and composition",
  },
  {
    zh: "落入意匠格",
    en: "Place it on a squared draft",
    detailZh: "把图样转成经纬格信息",
    detailEn: "Translate the design into warp and weft cells",
  },
  {
    zh: "生成花本提示",
    en: "Create pattern cues",
    detailZh: "为之后的提经准备顺序",
    detailEn: "Prepare the sequence used for warp lifting",
  },
] as const;

export function PatternCodingScreen(props: PatternCodingScreenProps) {
  const [completedSteps, setCompletedSteps] = useState(0);
  const ready = completedSteps === CODING_STEPS.length;
  const palette = PALETTES[props.recipe.palette];

  return (
    <section className="screen coding-screen" lang={props.locale === "zh" ? "zh-CN" : "en"}>
      <header className="weaving-header coding-header">
        <Brand locale={props.locale} compact />
        <h1>{localized(props.locale, "把纹样转成数字花本", "Create Pattern Cues")}</h1>
        <div className="weaving-status">
          <span>{localized(props.locale, "第 2 步 · 花本转译", "Step 2 · Pattern cues")}</span>
          <ExitButton locale={props.locale} onExit={props.onExit} />
          <SoundToggle locale={props.locale} enabled={props.soundEnabled} onToggle={props.onSoundToggle} compact />
        </div>
      </header>

      <div className="coding-layout">
        <div className={`coding-preview is-step-${completedSteps}`}>
          <WeaveCanvas matrix={props.matrix} palette={palette} recipe={props.recipe} completedRows={24} locale={props.locale} />
          <div className="coding-square-grid" aria-hidden="true" />
          <div className="coding-cues" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
          <div className="coding-preview-label">
            <span>{localized(props.locale, "你选择的纹样方案", "Your motif proposal")}</span>
            <strong>{props.locale === "zh" ? props.proposal.titleZh : props.proposal.titleEn}</strong>
          </div>
        </div>

        <aside className="coding-panel">
          <span className="panel-label">{localized(props.locale, "挑花结本 · 数字转译", "Pattern coding · digital interpretation")}</span>
          <h2>{localized(props.locale, "花本不是成品图，而是织造依据", "Pattern cues are instructions, not the finished image")}</h2>
          <p>{localized(
            props.locale,
            "真实南京云锦要经过意匠与挑花结本，把图样转为拽花工可依循的提花信息。本作只用三个触屏步骤解释这层关系，并非花本制作复原。",
            "Real Nanjing Yunjin uses squared drafting and pattern coding to turn a design into information the upper artisan can follow. These three touchscreen steps only explain that relationship; they do not reconstruct the craft.",
          )}</p>
          <div className="coding-steps" aria-label={localized(props.locale, "数字花本生成步骤", "Digital pattern cue steps")}>
            {CODING_STEPS.map((step, index) => {
              const complete = index < completedSteps;
              const active = index === completedSteps;
              return (
                <button
                  type="button"
                  className={`${complete ? "is-complete" : ""}${active ? " is-active" : ""}`}
                  disabled={!active}
                  onClick={() => setCompletedSteps(index + 1)}
                  key={step.en}
                >
                  <b>{complete ? "✓" : index + 1}</b>
                  <span><strong>{props.locale === "zh" ? step.zh : step.en}</strong><small>{props.locale === "zh" ? step.detailZh : step.detailEn}</small></span>
                </button>
              );
            })}
          </div>
          <div className="coding-status" role="status" aria-live="polite">
            {ready
              ? localized(props.locale, "数字花本提示已经准备好", "The digital pattern cues are ready")
              : localized(props.locale, `完成 ${completedSteps} / 3`, `${completedSteps} / 3 complete`)}
          </div>
          <button type="button" className="coding-confirm-action" disabled={!ready} onClick={props.onComplete}>
            <span>{localized(props.locale, "选择共织方式", "Choose How to Weave")}</span><ArrowIcon />
          </button>
        </aside>
      </div>
      <Disclaimer locale={props.locale} />
    </section>
  );
}
