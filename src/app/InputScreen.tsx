import { useMemo } from "react";
import { INTENT_COPY, PRESETS, localized } from "../content/project";
import type { IntentId, Locale } from "../core/types";
import { countGraphemes } from "../core/classifier";
import { AbundanceIcon, ArrowIcon, CloudIcon, CourageIcon, JoyIcon, KnotIcon, LongevityIcon } from "./icons";
import { Brand, LanguageToggle, OrnamentalRule, SoundToggle } from "./common";

interface InputScreenProps {
  locale: Locale;
  value: string;
  error: string;
  analyzing: boolean;
  analyzingIntent?: IntentId;
  soundEnabled: boolean;
  onLocaleChange: (locale: Locale) => void;
  onSoundToggle: () => void;
  onChange: (value: string) => void;
  onPreset: (intent: IntentId, value: string) => void;
  onSubmit: () => void;
}

const PRESET_ICONS = [KnotIcon, CloudIcon, CourageIcon, AbundanceIcon, JoyIcon, LongevityIcon];

export function InputScreen(props: InputScreenProps) {
  const characterCount = useMemo(() => countGraphemes(props.value), [props.value]);
  const analyzingIntent = props.analyzingIntent ? INTENT_COPY[props.analyzingIntent] : undefined;
  const journey = props.locale === "zh"
    ? ["写下心愿", "选择纹样", "转译共织", "带走锦愿"]
    : ["Write a wish", "Choose a motif", "Translate and weave", "Keep your wish"];
  return (
    <section className="screen input-screen" lang={props.locale === "zh" ? "zh-CN" : "en"} aria-labelledby="experience-title">
      <div className="input-background" aria-hidden="true" />
      <div className="input-controls">
        <SoundToggle locale={props.locale} enabled={props.soundEnabled} onToggle={props.onSoundToggle} compact />
        <LanguageToggle locale={props.locale} onChange={props.onLocaleChange} />
      </div>
      <div className="input-intro">
        <Brand locale={props.locale} />
        <h1 id="experience-title">{localized(props.locale, "AI共织锦愿", "Woven Wishes with AI")}</h1>
        <OrnamentalRule />
        <p className="intro-copy">{props.locale === "zh"
          ? <>一人提经，一人送梭；<br />把你的心愿织进经纬。</>
          : <>One lifts the warps; one sends the shuttle.<br />Weave your wish into warp and weft.</>}</p>
        <div className="input-weave-demo" aria-hidden="true">
          <span className="demo-role demo-role--upper">{localized(props.locale, "提经", "Lift")}</span>
          <span className="demo-role demo-role--lower">{localized(props.locale, "送梭", "Send")}</span>
          <span className="demo-warps">{Array.from({ length: 11 }, (_, index) => <i key={index} />)}</span>
          <span className="demo-shed" />
          <span className="demo-shuttle"><i /></span>
          <span className="demo-motif"><i /><i /><i /><i /></span>
        </div>
      </div>

      <ol className="journey-steps" aria-label={props.locale === "zh" ? "体验步骤" : "Experience steps"}>
        {journey.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}
      </ol>

      <div className="wish-workspace">
        <div className={`wish-input-wrap ${props.error ? "has-error" : ""}`}>
          <textarea
            value={props.value}
            onChange={(event) => props.onChange(event.target.value)}
            placeholder={localized(props.locale, "例如：愿远方的家人平安", "For example: May my family afar be safe")}
            aria-label={localized(props.locale, "心愿输入", "Wish input")}
            autoComplete="off"
            spellCheck="false"
            disabled={props.analyzing}
          />
          <span className="character-count" aria-label={`${characterCount} / 48`}>{characterCount} / 48</span>
          {props.error ? <p className="input-error" role="alert">{props.error}</p> : null}
          {props.analyzing ? (
            <div className="analysis-overlay" role="status" aria-live="polite">
              <div className="analysis-thread" />
              <strong>{analyzingIntent
                ? localized(props.locale, `AI读懂了：${analyzingIntent.nameZh}`, `AI understands: ${analyzingIntent.nameEn}`)
                : localized(props.locale, "AI正在理解锦愿", "AI is reading your wish")}</strong>
              <span>{localized(
                props.locale,
                "正在提出三张纹样方案，由你决定主纹与构图",
                "Preparing three motif proposals for you to choose",
              )}</span>
            </div>
          ) : null}
        </div>

        <div className="preset-zone">
          <div className="preset-row" aria-label={localized(props.locale, "心愿示例", "Wish examples")}>
            {PRESETS.map((preset, index) => {
              const Icon = PRESET_ICONS[index];
              const wish = props.locale === "zh" ? preset.wishZh : preset.wishEn;
              const selected = props.value === wish;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`preset-option ${selected ? "is-selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => props.onPreset(preset.id, wish)}
                  disabled={props.analyzing}
                >
                  <span className="preset-icon"><Icon /></span>
                  <b>{props.locale === "zh" ? preset.zh : preset.en}</b>
                </button>
              );
            })}
          </div>
          <p className="variation-note">{localized(
            props.locale,
            "六类心意只是入口。不同用词会改变主纹、构图、边饰与配色。",
            "Six intentions are only starting points. Your wording changes the motif, layout, border and colours.",
          )}</p>
        </div>

        <button type="button" className="primary-action" onClick={props.onSubmit} disabled={props.analyzing}>
          <span>{localized(props.locale, "织下这份心愿", "Weave My Wish")}</span><ArrowIcon />
        </button>
      </div>

      <div className="input-footer"><CloudIcon /><span>{localized(
        props.locale,
        "受南京云锦木机妆花两人协作启发的数字体验，并非工艺复原。",
        "A digital experience inspired by two-person Nanjing Yunjin zhuanghua weaving; not a craft reconstruction.",
      )}</span></div>
    </section>
  );
}
