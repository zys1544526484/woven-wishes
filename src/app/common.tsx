import type { Locale } from "../core/types";
import { PROJECT_TITLE_ZH } from "../content/project";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "brand brand--compact" : "brand"}>{PROJECT_TITLE_ZH}</div>;
}

export function LanguageToggle({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  return (
    <div className="language-toggle" role="group" aria-label="Language">
      <button type="button" className={locale === "zh" ? "is-active" : ""} onClick={() => onChange("zh")} aria-pressed={locale === "zh"}>中</button>
      <button type="button" className={locale === "en" ? "is-active" : ""} onClick={() => onChange("en")} aria-pressed={locale === "en"}>EN</button>
    </div>
  );
}

export function OrnamentalRule({ className = "" }: { className?: string }) {
  return <div className={`ornamental-rule ${className}`} aria-hidden="true"><span /><i>◆</i><span /></div>;
}

export function Disclaimer() {
  return <div className="experience-disclaimer">AI数字锦样 · 非真实云锦织造复原</div>;
}
