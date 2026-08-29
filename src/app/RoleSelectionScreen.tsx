import { PALETTES } from "../content/motifs";
import { localized } from "../content/project";
import type { Locale, PatternMatrix, PatternProposal, PatternRecipe, WeaveMode } from "../core/types";
import { WeaveCanvas } from "../render/WeaveCanvas";
import { ArrowIcon } from "./icons";
import { Brand, Disclaimer, ExitButton, SoundToggle } from "./common";

interface RoleSelectionScreenProps {
  locale: Locale;
  wish: string;
  matrix: PatternMatrix;
  recipe: PatternRecipe;
  proposal: PatternProposal;
  mode: WeaveMode;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onExit: () => void;
  onModeChange: (mode: WeaveMode) => void;
  onConfirm: () => void;
}

const MODES: Array<{
  id: WeaveMode;
  zh: string;
  en: string;
  detailZh: string;
  detailEn: string;
  tagZh?: string;
  tagEn?: string;
  featured?: boolean;
}> = [
  {
    id: "player-weaver",
    zh: "我来送梭",
    en: "I Send the Shuttle",
    detailZh: "AI按数字花本准备经线，你沿纬向完成每一梭。",
    detailEn: "AI prepares the warps from the digital plan; you send every weft pass.",
    tagZh: "单人快速开始",
    tagEn: "Quick solo start",
  },
  {
    id: "player-drawboy",
    zh: "我来提经",
    en: "I Lift the Warps",
    detailZh: "你按住提经提示，AI配合完成送梭。",
    detailEn: "Hold the warp cue while AI sends the shuttle.",
  },
  {
    id: "duo",
    zh: "两人共织",
    en: "Two People Weave",
    detailZh: "一人按住上方提经区，另一人同时沿纬向送梭。",
    detailEn: "One person holds the upper warp cue while another sends the shuttle.",
    tagZh: "双人到场推荐",
    tagEn: "Best with two people",
    featured: true,
  },
];

export function RoleSelectionScreen(props: RoleSelectionScreenProps) {
  const palette = PALETTES[props.recipe.palette];
  return (
    <section className="screen role-screen" lang={props.locale === "zh" ? "zh-CN" : "en"}>
      <header className="weaving-header role-header">
        <Brand locale={props.locale} compact />
        <h1>{localized(props.locale, "选择共织方式", "Choose How to Weave")}</h1>
        <div className="weaving-status">
          <span>{localized(props.locale, "第 3 步 / 4", "Step 3 / 4")}</span>
          <ExitButton locale={props.locale} onExit={props.onExit} />
          <SoundToggle locale={props.locale} enabled={props.soundEnabled} onToggle={props.onSoundToggle} compact />
        </div>
      </header>

      <div className="role-layout">
        <div className="role-loom-map">
          <WeaveCanvas matrix={props.matrix} palette={palette} recipe={props.recipe} completedRows={24} locale={props.locale} />
          <div className="role-map-veil" aria-hidden="true" />
          <div className="role-node role-node--upper">
            <span>{localized(props.locale, "上方角色", "Upper role")}</span>
            <strong>{localized(props.locale, "按花本提经", "Lift selected warps")}</strong>
          </div>
          <div className="role-link" aria-hidden="true"><i /><b>×</b><i /></div>
          <div className="role-node role-node--lower">
            <span>{localized(props.locale, "下方角色", "Lower role")}</span>
            <strong>{localized(props.locale, "沿纬向送梭", "Send the weft shuttle")}</strong>
          </div>
          <p className="role-map-caption">{localized(
            props.locale,
            "本作把真实木机妆花的两人配合转译为触屏协作，不是工艺操作复原。",
            "This touchscreen interaction translates the two-person coordination of zhuanghua; it is not a craft reconstruction.",
          )}</p>
        </div>

        <aside className="role-choice-panel">
          <span className="panel-label">{localized(props.locale, "你的数字花本", "Your digital pattern plan")}</span>
          <h2>{props.locale === "zh" ? props.proposal.titleZh : props.proposal.titleEn}</h2>
          <p className="role-wish">“{props.wish}”</p>
          <div className="mode-options" role="radiogroup" aria-label={localized(props.locale, "共织方式", "Weaving mode")}>
            {MODES.map((mode, index) => {
              const selected = props.mode === mode.id;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`mode-option${selected ? " is-selected" : ""}${mode.featured ? " is-featured" : ""}`}
                  key={mode.id}
                  onClick={() => props.onModeChange(mode.id)}
                >
                  <span className="mode-index">{index + 1}</span>
                  <span className="mode-copy">
                    <strong>{props.locale === "zh" ? mode.zh : mode.en}</strong>
                    <small>{props.locale === "zh" ? mode.detailZh : mode.detailEn}</small>
                  </span>
                  {mode.tagZh ? <em>{props.locale === "zh" ? mode.tagZh : mode.tagEn}</em> : null}
                </button>
              );
            })}
          </div>
          <button type="button" className="role-confirm-action" onClick={props.onConfirm}>
            <span>{localized(props.locale, "开始共织", "Begin Weaving")}</span>
            <ArrowIcon />
          </button>
        </aside>
      </div>
      <Disclaimer locale={props.locale} />
    </section>
  );
}
