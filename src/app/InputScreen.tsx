import { useMemo } from "react";
import { PRESETS, localized } from "../content/project";
import type { IntentId, Locale } from "../core/types";
import { countGraphemes } from "../core/classifier";
import { AbundanceIcon, ArrowIcon, CloudIcon, CourageIcon, KnotIcon } from "./icons";
import { Brand, LanguageToggle, OrnamentalRule } from "./common";

interface InputScreenProps {
  locale: Locale;
  value: string;
  error: string;
  analyzing: boolean;
  onLocaleChange: (locale: Locale) => void;
  onChange: (value: string) => void;
  onPreset: (intent: IntentId, value: string) => void;
  onSubmit: () => void;
}

const PRESET_ICONS = [KnotIcon, CloudIcon, CourageIcon, AbundanceIcon];

export function InputScreen(props: InputScreenProps) {
  const characterCount = useMemo(() => countGraphemes(props.value), [props.value]);
  return (
    <section className="screen input-screen" aria-labelledby="experience-title">
      <div className="input-background" aria-hidden="true" />
      <LanguageToggle locale={props.locale} onChange={props.onLocaleChange} />
      <div className="input-intro">
        <Brand />
        <h1 id="experience-title">AI共织锦愿</h1>
        <OrnamentalRule />
        <p className="intro-zh">写下一句想送给世界的愿望，<br />AI会把它转译成一幅数字锦样。</p>
        <p className="intro-en">Write a wish for the world.<br />AI will translate it into a digital<br />brocade pattern.</p>
      </div>

      <div className="wish-workspace">
        <div className={`wish-input-wrap ${props.error ? "has-error" : ""}`}>
          <textarea
            value={props.value}
            onChange={(event) => props.onChange(event.target.value)}
            placeholder={localized(props.locale, "愿远方的家人平安 / May my family afar be safe", "May my family afar be safe / 愿远方的家人平安")}
            aria-label="愿望输入 / Wish input"
            autoComplete="off"
            spellCheck="false"
            disabled={props.analyzing}
          />
          <span className="character-count" aria-label={`${characterCount} / 48`}>{characterCount} / 48</span>
          {props.error ? <p className="input-error" role="alert">{props.error}</p> : null}
          {props.analyzing ? (
            <div className="analysis-overlay" role="status" aria-live="polite">
              <div className="analysis-thread" />
              <strong>AI正在理解锦愿</strong>
              <span>理解愿望 · 匹配纹样 · 生成织序</span>
            </div>
          ) : null}
        </div>

        <div className="preset-row" aria-label="预设愿望">
          {PRESETS.map((preset, index) => {
            const Icon = PRESET_ICONS[index];
            const wish = props.locale === "zh" ? preset.wishZh : preset.wishEn;
            return (
              <button key={preset.id} type="button" className="preset-option" onClick={() => props.onPreset(preset.id, wish)} disabled={props.analyzing}>
                <span className="preset-icon"><Icon /></span>
                <span><b>{preset.zh}</b><small>{preset.en}</small></span>
              </button>
            );
          })}
        </div>

        <button type="button" className="primary-action" onClick={props.onSubmit} disabled={props.analyzing}>
          <span>织下这份心愿</span><small>Weave My Wish</small><ArrowIcon />
        </button>
      </div>

      <div className="input-footer"><CloudIcon /><span>受南京云锦文化启发的AI数字共创体验</span></div>
    </section>
  );
}
