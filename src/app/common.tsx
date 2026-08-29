import type { Locale } from "../core/types";
import {
  EXPERIENCE_DISCLAIMER_EN,
  EXPERIENCE_DISCLAIMER_ZH,
  PROJECT_TITLE_EN,
  PROJECT_TITLE_ZH,
} from "../content/project";
import { SoundIcon } from "./icons";

export function Brand({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return <div className={compact ? "brand brand--compact" : "brand"}>{locale === "zh" ? PROJECT_TITLE_ZH : PROJECT_TITLE_EN}</div>;
}

export function LanguageToggle({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  return (
    <div className="language-toggle" role="group" aria-label="Language">
      <button type="button" className={locale === "zh" ? "is-active" : ""} onClick={() => onChange("zh")} aria-pressed={locale === "zh"}>中</button>
      <button type="button" className={locale === "en" ? "is-active" : ""} onClick={() => onChange("en")} aria-pressed={locale === "en"}>EN</button>
    </div>
  );
}

export function SoundToggle({ locale, enabled, onToggle, compact = false }: { locale: Locale; enabled: boolean; onToggle: () => void; compact?: boolean }) {
  const label = locale === "zh"
    ? (enabled ? "关闭声音" : "开启声音")
    : (enabled ? "Turn sound off" : "Turn sound on");
  return (
    <button
      type="button"
      className={`sound-toggle${compact ? " sound-toggle--compact" : ""}`}
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
    >
      <SoundIcon muted={!enabled} />
      {compact ? null : <span>{locale === "zh" ? `声音：${enabled ? "开" : "关"}` : `Sound: ${enabled ? "On" : "Off"}`}</span>}
    </button>
  );
}

export function ExitButton({ locale, onExit }: { locale: Locale; onExit: () => void }) {
  const label = locale === "zh" ? "返回首页" : "Return Home";
  return (
    <button type="button" className="exit-button" onClick={onExit} aria-label={label} title={label}>
      <span aria-hidden="true">←</span>
      <b>{locale === "zh" ? "返回首页" : "Home"}</b>
    </button>
  );
}

export function OrnamentalRule({ className = "" }: { className?: string }) {
  return <div className={`ornamental-rule ${className}`} aria-hidden="true"><span /><i>◆</i><span /></div>;
}

export function Disclaimer({ locale }: { locale: Locale }) {
  return <div className="experience-disclaimer">{locale === "zh" ? EXPERIENCE_DISCLAIMER_ZH : EXPERIENCE_DISCLAIMER_EN}</div>;
}
