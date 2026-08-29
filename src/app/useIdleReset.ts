import { useEffect, useState } from "react";
import type { AppPhase } from "./state";

export function useIdleReset(phase: AppPhase, hasInput: boolean, onReset: () => void): number | null {
  const [warning, setWarning] = useState<number | null>(null);

  useEffect(() => {
    if (phase === "analyzing" || phase === "result-rendering" || (phase === "input" && !hasInput)) {
      setWarning(null);
      return;
    }

    const activeCreation = phase === "plan-selection" || phase === "role-selection" || phase === "weaving";
    const total = phase === "input" ? 120_000 : activeCreation ? 60_000 : 45_000;
    const warningDuration = phase === "input" ? 0 : 10_000;
    let warningTimer = 0;
    let resetTimer = 0;
    let countdownTimer = 0;

    const clear = () => {
      window.clearTimeout(warningTimer);
      window.clearTimeout(resetTimer);
      window.clearInterval(countdownTimer);
    };
    const arm = () => {
      clear();
      setWarning(null);
      if (warningDuration > 0) {
        warningTimer = window.setTimeout(() => {
          let remaining = warningDuration / 1000;
          setWarning(remaining);
          countdownTimer = window.setInterval(() => {
            remaining -= 1;
            setWarning(Math.max(remaining, 0));
          }, 1000);
        }, total - warningDuration);
      }
      resetTimer = window.setTimeout(onReset, total);
    };
    const activity = () => arm();
    arm();
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity);
    return () => {
      clear();
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
    };
  }, [phase, hasInput, onReset]);

  return warning;
}
