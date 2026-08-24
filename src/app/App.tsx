import { useCallback, useEffect, useReducer, useRef } from "react";
import { processWish } from "../core/classifier";
import { buildShareUrl } from "../core/codec";
import { composePattern, generatePatternMatrix } from "../core/pattern";
import type { IntentId, SharePayloadV1 } from "../core/types";
import { createQrDataUrl } from "../render/qr";
import { InputScreen } from "./InputScreen";
import { ResultScreen } from "./ResultScreen";
import { initialState, appReducer } from "./state";
import { useIdleReset } from "./useIdleReset";
import { WeavingScreen } from "./WeavingScreen";

function errorMessage(reason?: string): string {
  if (reason === "too-short") return "请至少写下两个字或两个字符。";
  if (reason === "too-long") return "心愿有点长，请缩短到48个字符以内。";
  if (reason === "unsafe") return "这个心愿暂时无法织成，请换一种表达。";
  return "请先写下一句心愿。";
}

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const timers = useRef<number[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);
  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.current = timers.current.filter((value) => value !== timer);
      callback();
    }, delay);
    timers.current.push(timer);
  }, []);
  const reset = useCallback(() => {
    clearTimers();
    dispatch({ type: "RESET" });
  }, [clearTimers]);
  const idleWarning = useIdleReset(state.phase, Boolean(state.wishInput), reset);

  useEffect(() => clearTimers, [clearTimers]);

  const submit = useCallback(() => {
    const result = processWish(state.wishInput);
    if (!result.analysis) {
      dispatch({ type: "SET_ERROR", error: errorMessage(result.reason) });
      return;
    }
    const recipe = composePattern(result.analysis);
    const matrix = generatePatternMatrix(recipe);
    dispatch({ type: "START_ANALYSIS", wish: result.displayText, analysis: result.analysis, recipe, matrix });
  }, [state.wishInput]);

  useEffect(() => {
    if (state.phase !== "analyzing") return;
    const timer = window.setTimeout(() => dispatch({ type: "START_WEAVING" }), 1300);
    return () => window.clearTimeout(timer);
  }, [state.phase]);

  const commitRow = useCallback(() => {
    if (state.phase !== "weaving" || state.committingRow !== undefined || state.completedRows >= 24) return;
    const row = state.completedRows;
    dispatch({ type: "START_ROW", row });
    schedule(() => {
      dispatch({ type: "COMMIT_ROW" });
      if (row === 23) schedule(() => dispatch({ type: "START_RESULT" }), 800);
    }, 450);
  }, [state.phase, state.committingRow, state.completedRows, schedule]);

  useEffect(() => {
    if (state.phase !== "result-rendering" || !state.analysis || !state.recipe) return;
    let active = true;
    const payload: SharePayloadV1 = {
      codecVersion: 1,
      recipe: state.recipe,
      locale: state.locale,
      wish: state.wish,
      primaryIntent: state.analysis.primaryIntent,
      secondaryIntent: state.analysis.secondaryIntent,
    };
    const qrUrl = buildShareUrl(payload, import.meta.env.VITE_SHARE_BASE_URL);
    createQrDataUrl(qrUrl).then((qrDataUrl) => {
      if (active) dispatch({ type: "RESULT_READY", qrUrl, qrDataUrl });
    }).catch(() => {
      if (active) dispatch({ type: "RESULT_READY", qrUrl, qrDataUrl: "" });
    });
    return () => { active = false; };
  }, [state.phase, state.analysis, state.recipe, state.locale, state.wish]);

  const choosePreset = (_intent: IntentId, wish: string) => dispatch({ type: "SET_INPUT", value: wish });

  return (
    <div className="app-viewport">
      <div className="exhibit-stage">
        {state.phase === "input" || state.phase === "analyzing" ? (
          <InputScreen
            locale={state.locale}
            value={state.wishInput}
            error={state.error}
            analyzing={state.phase === "analyzing"}
            onLocaleChange={(locale) => dispatch({ type: "SET_LOCALE", locale })}
            onChange={(value) => dispatch({ type: "SET_INPUT", value })}
            onPreset={choosePreset}
            onSubmit={submit}
          />
        ) : null}
        {state.phase === "weaving" && state.analysis && state.matrix && state.recipe ? (
          <WeavingScreen
            locale={state.locale}
            wish={state.wish}
            primaryIntent={state.analysis.primaryIntent}
            matrix={state.matrix}
            recipe={state.recipe}
            completedRows={state.completedRows}
            committingRow={state.committingRow}
            onCommit={commitRow}
          />
        ) : null}
        {(state.phase === "result-rendering" || state.phase === "result") && state.analysis && state.matrix && state.recipe ? (
          <ResultScreen
            locale={state.locale}
            wish={state.wish}
            primaryIntent={state.analysis.primaryIntent}
            matrix={state.matrix}
            recipe={state.recipe}
            qrDataUrl={state.qrDataUrl}
            shareUrl={state.qrUrl}
            onRestart={reset}
          />
        ) : null}
        {idleWarning !== null ? <div className="idle-warning" role="alert">即将回到开始页 · {idleWarning}</div> : null}
      </div>
    </div>
  );
}
