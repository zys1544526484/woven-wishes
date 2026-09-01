import { useCallback, useEffect, useReducer, useRef } from "react";
import { processWish } from "../core/classifier";
import { buildShareUrl } from "../core/codec";
import { composePatternProposals, generatePatternMatrix } from "../core/pattern";
import type { IntentId, Locale, PaletteId, SharePayloadV2, WeaveMode } from "../core/types";
import { createQrDataUrl } from "../render/qr";
import { InputScreen } from "./InputScreen";
import { PatternPlanScreen } from "./PatternPlanScreen";
import { ResultScreen } from "./ResultScreen";
import { RoleSelectionScreen } from "./RoleSelectionScreen";
import { initialState, appReducer } from "./state";
import { useIdleReset } from "./useIdleReset";
import { WeavingScreen } from "./WeavingScreen";
import { useSoundscape } from "../audio/useSoundscape";

function errorMessage(locale: Locale, reason?: string): string {
  if (locale === "en") {
    if (reason === "too-short") return "Please enter at least two characters.";
    if (reason === "too-long") return "Please shorten your wish to 48 characters.";
    if (reason === "unsafe") return "This wish cannot be woven. Please try another expression.";
    return "Please write a wish first.";
  }
  if (reason === "too-short") return "请至少写下两个字或两个字符。";
  if (reason === "too-long") return "心愿有点长，请缩短到48个字符以内。";
  if (reason === "unsafe") return "这个心愿暂时无法织成，请换一种表达。";
  return "请先写下一句心愿。";
}

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const sound = useSoundscape();
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

  useEffect(() => {
    document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
  }, [state.locale]);

  const submit = useCallback(() => {
    const result = processWish(state.wishInput);
    if (!result.analysis) {
      dispatch({ type: "SET_ERROR", error: errorMessage(state.locale, result.reason) });
      return;
    }
    const proposals = composePatternProposals(result.analysis);
    const recipe = proposals[0].recipe;
    const matrix = generatePatternMatrix(recipe);
    sound.start();
    dispatch({ type: "START_ANALYSIS", wish: result.displayText, analysis: result.analysis, proposals, recipe, matrix });
  }, [sound, state.locale, state.wishInput]);

  useEffect(() => {
    if (state.phase !== "analyzing") return;
    const timer = window.setTimeout(() => dispatch({ type: "OPEN_PLAN_SELECTION" }), 1450);
    return () => window.clearTimeout(timer);
  }, [state.phase]);

  const selectCandidate = useCallback((index: number) => {
    const proposal = state.proposals[index];
    if (!proposal) return;
    const recipe = { ...proposal.recipe, palette: state.selectedPalette };
    dispatch({ type: "SELECT_PLAN", index, recipe, matrix: generatePatternMatrix(recipe) });
  }, [state.proposals, state.selectedPalette]);

  const selectPalette = useCallback((palette: PaletteId) => {
    if (!state.recipe) return;
    const recipe = { ...state.recipe, palette };
    dispatch({ type: "SELECT_PALETTE", palette, recipe, matrix: generatePatternMatrix(recipe) });
  }, [state.recipe]);

  const selectWeaveMode = useCallback((mode: WeaveMode) => {
    dispatch({ type: "SET_WEAVE_MODE", mode });
  }, []);

  const commitRow = useCallback(() => {
    if (state.phase !== "weaving" || state.committingRow !== undefined || state.completedRows >= 24) return;
    const row = state.completedRows;
    sound.playWeft(row);
    dispatch({ type: "START_ROW", row });
    schedule(() => {
      dispatch({ type: "COMMIT_ROW" });
      if (row === 23) schedule(() => {
        sound.playComplete();
        dispatch({ type: "START_RESULT" });
      }, 800);
    }, 320);
  }, [state.phase, state.committingRow, state.completedRows, schedule, sound]);

  useEffect(() => {
    if (state.phase !== "result-rendering" || !state.analysis || !state.recipe) return;
    let active = true;
    const proposal = state.proposals[state.selectedCandidate];
    if (!proposal) return;
    const payload: SharePayloadV2 = {
      codecVersion: 2,
      recipe: state.recipe,
      locale: state.locale,
      wish: state.wish,
      primaryIntent: state.analysis.primaryIntent,
      secondaryIntent: state.analysis.secondaryIntent,
      proposalId: proposal.id,
      weaveMode: state.weaveMode,
    };
    const qrUrl = buildShareUrl(payload, import.meta.env.VITE_SHARE_BASE_URL);
    createQrDataUrl(qrUrl).then((qrDataUrl) => {
      if (active) dispatch({ type: "RESULT_READY", qrUrl, qrDataUrl });
    }).catch(() => {
      if (active) dispatch({ type: "RESULT_READY", qrUrl, qrDataUrl: "" });
    });
    return () => { active = false; };
  }, [state.phase, state.analysis, state.recipe, state.locale, state.wish, state.proposals, state.selectedCandidate, state.weaveMode]);

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
            analyzingIntent={state.analysis?.primaryIntent}
            soundEnabled={sound.enabled}
            onLocaleChange={(locale) => dispatch({ type: "SET_LOCALE", locale })}
            onSoundToggle={sound.toggle}
            onChange={(value) => dispatch({ type: "SET_INPUT", value })}
            onPreset={choosePreset}
            onSubmit={submit}
          />
        ) : null}
        {state.phase === "plan-selection" && state.analysis && state.recipe ? (
          <PatternPlanScreen
            locale={state.locale}
            wish={state.wish}
            analysis={state.analysis}
            proposals={state.proposals}
            selectedIndex={state.selectedCandidate}
            planChosen={state.planChosen}
            selectedPalette={state.selectedPalette}
            soundEnabled={sound.enabled}
            onSoundToggle={sound.toggle}
            onExit={reset}
            onSelectCandidate={selectCandidate}
            onSelectPalette={selectPalette}
            onConfirm={() => dispatch({ type: "CONFIRM_PLAN" })}
          />
        ) : null}
        {state.phase === "role-selection" && state.analysis && state.matrix && state.recipe ? (
          <RoleSelectionScreen
            locale={state.locale}
            wish={state.wish}
            matrix={state.matrix}
            recipe={state.recipe}
            proposal={state.proposals[state.selectedCandidate]}
            mode={state.weaveMode}
            soundEnabled={sound.enabled}
            onSoundToggle={sound.toggle}
            onExit={reset}
            onModeChange={selectWeaveMode}
            onConfirm={() => dispatch({ type: "START_WEAVING" })}
          />
        ) : null}
        {state.phase === "weaving" && state.analysis && state.matrix && state.recipe ? (
          <WeavingScreen
            locale={state.locale}
            wish={state.wish}
            primaryIntent={state.analysis.primaryIntent}
            matrix={state.matrix}
            recipe={state.recipe}
            proposal={state.proposals[state.selectedCandidate]}
            completedRows={state.completedRows}
            committingRow={state.committingRow}
            weaveMode={state.weaveMode}
            soundEnabled={sound.enabled}
            onSoundToggle={sound.toggle}
            onExit={reset}
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
            proposal={state.proposals[state.selectedCandidate]}
            weaveMode={state.weaveMode}
            qrDataUrl={state.qrDataUrl}
            shareUrl={state.qrUrl}
            soundEnabled={sound.enabled}
            onSoundToggle={sound.toggle}
            onRestart={reset}
          />
        ) : null}
        {idleWarning !== null ? <div className="idle-warning" role="alert">{state.locale === "zh" ? "即将回到开始页" : "Returning to the start"} · {idleWarning}</div> : null}
      </div>
    </div>
  );
}
