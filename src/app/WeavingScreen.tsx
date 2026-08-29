import { useCallback, useEffect, useRef, useState } from "react";
import shuttleAsset from "../assets/shuttle.png";
import { getWeaveStageTip } from "../content/craftTips";
import { INTENT_COPY, localized } from "../content/project";
import { PALETTES } from "../content/motifs";
import { isValidWeaveGesture } from "../core/gesture";
import type { IntentId, Locale, PatternMatrix, PatternProposal, PatternRecipe, WeaveMode, WeaveStageId } from "../core/types";
import { WeaveCanvas } from "../render/WeaveCanvas";
import { Brand, Disclaimer, ExitButton, OrnamentalRule, SoundToggle } from "./common";
import { PauseIcon } from "./icons";

interface WeavingScreenProps {
  locale: Locale;
  wish: string;
  primaryIntent: IntentId;
  matrix: PatternMatrix;
  recipe: PatternRecipe;
  proposal: PatternProposal;
  completedRows: number;
  committingRow?: number;
  weaveMode: WeaveMode;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onExit: () => void;
  onCommit: () => void;
}

const STAGE_COPY: ReadonlyArray<{ id: WeaveStageId; zh: string; en: string; detailZh: string; detailEn: string }> = [
  { id: "ground", zh: "地部成形", en: "Ground takes shape", detailZh: "先让经纬之间出现承托纹样的数字地部。", detailEn: "A digital woven ground first forms between warp and weft." },
  { id: "colour", zh: "彩纬入纹", en: "Colour enters", detailZh: "彩纬按数字花本进入选定区域，主纹逐渐可辨。", detailEn: "Coloured wefts enter selected areas and the main motif becomes legible." },
  { id: "gold", zh: "金线显花", en: "Gold reveals the motif", detailZh: "丝金层被逐步点亮，光泽开始勾勒纹样。", detailEn: "The digital gold layer lights up and defines the motif." },
  { id: "border", zh: "边饰合拢", en: "Border closes", detailZh: "连续边饰在最后几梭合拢，完成这张数字锦愿。", detailEn: "The continuous border closes over the final passes to complete the wish." },
] as const;

const MODE_COPY: Record<WeaveMode, { zh: string; en: string; upperZh: string; upperEn: string; lowerZh: string; lowerEn: string }> = {
  "player-weaver": { zh: "你送梭 · AI提经", en: "You send · AI lifts", upperZh: "AI", upperEn: "AI", lowerZh: "你", lowerEn: "You" },
  "player-drawboy": { zh: "你提经 · AI送梭", en: "You lift · AI sends", upperZh: "你", upperEn: "You", lowerZh: "AI", lowerEn: "AI" },
  duo: { zh: "两人同时配合", en: "Two people coordinate", upperZh: "玩家一", upperEn: "Player one", lowerZh: "玩家二", lowerEn: "Player two" },
};

type GestureFeedback = "short" | "direction" | "vertical" | "cancelled" | "extra-pointer" | "lift-released";

export function gestureFeedbackCopy(locale: Locale, feedback: GestureFeedback, direction: "ltr" | "rtl"): string {
  if (locale === "zh") {
    if (feedback === "direction") return direction === "ltr" ? "方向反了：这一梭请向右送" : "方向反了：这一梭请向左送";
    if (feedback === "vertical") return "请贴着横向轨道送梭";
    if (feedback === "cancelled") return "触控中断了，请重新送这一梭";
    if (feedback === "extra-pointer") return "检测到额外触点，请重新送这一梭";
    if (feedback === "lift-released") return "提经区松开了，请两人同时配合";
    return "还差一点：把梭子送到轨道另一端";
  }
  if (feedback === "direction") return direction === "ltr" ? "Wrong way: send this pass to the right" : "Wrong way: send this pass to the left";
  if (feedback === "vertical") return "Keep the shuttle on the horizontal track";
  if (feedback === "cancelled") return "Touch was interrupted; try this pass again";
  if (feedback === "extra-pointer") return "An extra touch was detected; try this pass again";
  if (feedback === "lift-released") return "The warp cue was released; coordinate both roles";
  return "A little farther: send the shuttle to the other end";
}

export function WeavingScreen({ locale, wish, primaryIntent, matrix, recipe, proposal, completedRows, committingRow, weaveMode, soundEnabled, onSoundToggle, onExit, onCommit }: WeavingScreenProps) {
  const [paused, setPaused] = useState(false);
  const [warpReady, setWarpReady] = useState(false);
  const [liftHeld, setLiftHeld] = useState(false);
  const [aiSending, setAiSending] = useState(false);
  const [gestureFeedback, setGestureFeedback] = useState<GestureFeedback | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const shuttleRef = useRef<HTMLImageElement>(null);
  const pointerId = useRef<number | null>(null);
  const liftPointerId = useRef<number | null>(null);
  const liftHeldRef = useRef(false);
  const liftTimer = useRef<number | undefined>(undefined);
  const aiTimer = useRef<number | undefined>(undefined);
  const feedbackTimer = useRef<number | undefined>(undefined);
  const invalidGesture = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const currentDelta = useRef(0);
  const rawDelta = useRef(0);
  const direction = completedRows % 2 === 0 ? "ltr" : "rtl";
  const isCommitting = committingRow !== undefined;
  const palette = PALETTES[recipe.palette];
  const intent = INTENT_COPY[primaryIntent];
  const activeStage = Math.min(3, Math.floor(completedRows / 6));
  const stage = STAGE_COPY[activeStage];
  const stageTip = getWeaveStageTip(completedRows);
  const modeCopy = MODE_COPY[weaveMode];
  const canDragShuttle = !paused && !isCommitting && weaveMode !== "player-drawboy"
    && (weaveMode === "player-weaver" ? warpReady : liftHeld);
  const showFirstPassGuide = weaveMode === "player-weaver" && completedRows === 0 && !isCommitting && !paused;

  const showGestureFeedback = useCallback((feedback: GestureFeedback) => {
    if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current);
    setGestureFeedback(feedback);
    feedbackTimer.current = window.setTimeout(() => {
      feedbackTimer.current = undefined;
      setGestureFeedback(null);
    }, 1700);
  }, []);

  const positionShuttle = useCallback((delta = 0, animate = false) => {
    const track = trackRef.current;
    const shuttle = shuttleRef.current;
    if (!track || !shuttle) return;
    const travel = Math.max(0, track.clientWidth - shuttle.clientWidth);
    const origin = direction === "ltr" ? 0 : travel;
    shuttle.style.transition = animate ? "transform 320ms cubic-bezier(.2,.8,.2,1)" : "none";
    shuttle.style.transform = `translate3d(${origin + delta}px, -50%, 0)`;
  }, [direction]);

  useEffect(() => positionShuttle(0, true), [positionShuttle, completedRows]);

  useEffect(() => {
    setWarpReady(false);
    setAiSending(false);
    liftHeldRef.current = false;
    setLiftHeld(false);
    if (weaveMode !== "player-weaver" || paused || isCommitting) return;
    const timer = window.setTimeout(() => setWarpReady(true), 380);
    return () => window.clearTimeout(timer);
  }, [completedRows, isCommitting, paused, weaveMode]);

  useEffect(() => () => {
    if (liftTimer.current !== undefined) window.clearTimeout(liftTimer.current);
    if (aiTimer.current !== undefined) window.clearTimeout(aiTimer.current);
    if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current);
  }, []);

  useEffect(() => {
    if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = undefined;
    setGestureFeedback(null);
  }, [completedRows]);

  const sendAiShuttle = useCallback((requireLift = false) => {
    if (weaveMode !== "player-drawboy" || paused || isCommitting || (requireLift && !liftHeldRef.current)) return;
    const track = trackRef.current;
    const shuttle = shuttleRef.current;
    if (!track || !shuttle) return;
    const travel = Math.max(1, track.clientWidth - shuttle.clientWidth);
    liftTimer.current = undefined;
    setWarpReady(true);
    setAiSending(true);
    positionShuttle(direction === "ltr" ? travel : -travel, true);
    aiTimer.current = window.setTimeout(() => {
      aiTimer.current = undefined;
      if (requireLift && !liftHeldRef.current) {
        setAiSending(false);
        positionShuttle(0, true);
        return;
      }
      setAiSending(false);
      onCommit();
    }, 180);
  }, [direction, isCommitting, onCommit, paused, positionShuttle, weaveMode]);

  useEffect(() => {
    const invalidateOnAdditionalPointer = (event: PointerEvent) => {
      if (pointerId.current === null || pointerId.current === event.pointerId) return;
      const allowedLiftPointer = weaveMode === "duo" && liftPointerId.current === event.pointerId;
      if (!allowedLiftPointer) invalidGesture.current = true;
    };
    const cancelOnBlur = () => {
      if (liftTimer.current !== undefined) window.clearTimeout(liftTimer.current);
      if (aiTimer.current !== undefined) window.clearTimeout(aiTimer.current);
      liftTimer.current = undefined;
      aiTimer.current = undefined;
      pointerId.current = null;
      liftPointerId.current = null;
      liftHeldRef.current = false;
      setLiftHeld(false);
      setAiSending(false);
      invalidGesture.current = true;
      shuttleRef.current?.classList.remove("is-dragging");
      positionShuttle(0, true);
    };
    window.addEventListener("pointerdown", invalidateOnAdditionalPointer, true);
    window.addEventListener("blur", cancelOnBlur);
    return () => {
      window.removeEventListener("pointerdown", invalidateOnAdditionalPointer, true);
      window.removeEventListener("blur", cancelOnBlur);
    };
  }, [positionShuttle, weaveMode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || isCommitting || paused) return;
      if (weaveMode === "player-drawboy" && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        sendAiShuttle();
        return;
      }
      if (weaveMode !== "player-weaver" || !warpReady) return;
      const valid = (direction === "ltr" && event.key === "ArrowRight") || (direction === "rtl" && event.key === "ArrowLeft");
      if (valid) {
        setGestureFeedback(null);
        onCommit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [direction, isCommitting, onCommit, paused, sendAiShuttle, warpReady, weaveMode]);

  const startLift = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (weaveMode === "player-weaver" || paused || isCommitting || liftPointerId.current !== null) return;
    liftPointerId.current = event.pointerId;
    liftHeldRef.current = true;
    setLiftHeld(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (weaveMode === "player-drawboy") liftTimer.current = window.setTimeout(() => sendAiShuttle(true), 520);
  };

  const finishLift = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (liftPointerId.current !== event.pointerId) return;
    liftPointerId.current = null;
    liftHeldRef.current = false;
    setLiftHeld(false);
    if (liftTimer.current !== undefined) window.clearTimeout(liftTimer.current);
    liftTimer.current = undefined;
    if (weaveMode === "player-drawboy" && aiTimer.current !== undefined) {
      window.clearTimeout(aiTimer.current);
      aiTimer.current = undefined;
      setAiSending(false);
      positionShuttle(0, true);
    }
    if (weaveMode === "duo" && pointerId.current !== null) {
      invalidGesture.current = true;
      positionShuttle(0, true);
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!canDragShuttle || pointerId.current !== null) return;
    pointerId.current = event.pointerId;
    invalidGesture.current = false;
    start.current = { x: event.clientX, y: event.clientY };
    currentDelta.current = 0;
    rawDelta.current = 0;
    if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = undefined;
    setGestureFeedback(null);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-dragging");
  };

  const onPointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    if (pointerId.current !== event.pointerId || !canDragShuttle) return;
    const track = trackRef.current;
    const shuttle = shuttleRef.current;
    if (!track || !shuttle) return;
    const travel = Math.max(1, track.clientWidth - shuttle.clientWidth);
    const raw = event.clientX - start.current.x;
    rawDelta.current = raw;
    const allowed = direction === "ltr" ? Math.max(0, raw) : Math.min(0, raw);
    currentDelta.current = Math.max(-travel, Math.min(travel, allowed));
    positionShuttle(currentDelta.current, false);
  };

  const finishPointer = (event: React.PointerEvent<HTMLImageElement>, cancelled = false) => {
    if (pointerId.current !== event.pointerId) return;
    const track = trackRef.current;
    const shuttle = shuttleRef.current;
    pointerId.current = null;
    event.currentTarget.classList.remove("is-dragging");
    if (!track || !shuttle) return;
    const travel = Math.max(1, track.clientWidth - shuttle.clientWidth);
    const deltaY = event.clientY - start.current.y;
    const wrongDirection = direction === "ltr" ? rawDelta.current < -12 : rawDelta.current > 12;
    const lostLift = weaveMode === "duo" && !liftHeldRef.current;
    const valid = isValidWeaveGesture({
      deltaX: currentDelta.current,
      deltaY,
      travel,
      trackHeight: track.clientHeight,
      direction,
      cancelled,
      multiPointer: invalidGesture.current || (weaveMode === "duo" && !liftHeldRef.current),
    });
    if (valid) {
      if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current);
      feedbackTimer.current = undefined;
      setGestureFeedback(null);
      positionShuttle(direction === "ltr" ? travel : -travel, true);
      onCommit();
    } else {
      positionShuttle(0, true);
      if (cancelled) showGestureFeedback("cancelled");
      else if (lostLift) showGestureFeedback("lift-released");
      else if (invalidGesture.current) showGestureFeedback("extra-pointer");
      else if (wrongDirection) showGestureFeedback("direction");
      else if (Math.abs(deltaY) > track.clientHeight * 0.35) showGestureFeedback("vertical");
      else showGestureFeedback("short");
    }
  };

  const liftStatus = weaveMode === "player-weaver"
    ? (warpReady ? localized(locale, "AI已提经，等待你送梭", "AI has lifted the warps; send the shuttle") : localized(locale, "AI正在按数字花本提经", "AI is lifting warps from the digital plan"))
    : weaveMode === "player-drawboy"
      ? (liftHeld ? localized(locale, "保持按住，AI正在准备送梭", "Keep holding while AI prepares the shuttle") : localized(locale, "按住这里完成本梭提经", "Hold here to lift warps for this pass"))
      : (liftHeld ? localized(locale, "经线已保持打开，请同伴送梭", "Warps held open; your partner can send") : localized(locale, "上方玩家先按住提经区", "Upper player holds the warp cue first"));

  return (
    <section className={`screen weaving-screen mode-${weaveMode} weave-stage-${stage.id}${committingRow === 23 ? " is-final-pass" : ""}`} lang={locale === "zh" ? "zh-CN" : "en"}>
      <header className="weaving-header">
        <Brand locale={locale} compact />
        <h1>{weaveMode === "duo" ? localized(locale, "两人共织", "Two-Person Weave") : localized(locale, "人机共织", "Human + AI Weave")}</h1>
        <div className="weaving-status">
          <span>{locale === "zh" ? "第" : "Pass"} <b>{Math.min(completedRows + 1, 24)}</b> / 24 {locale === "zh" ? "梭" : ""}</span>
          <ExitButton locale={locale} onExit={onExit} />
          <SoundToggle locale={locale} enabled={soundEnabled} onToggle={onSoundToggle} compact />
        </div>
      </header>
      <div className={`weaving-layout${paused ? " is-paused" : ""}`}>
        <aside className="plan-panel">
          <span className="panel-label">{localized(locale, "你的心意", "Your wish")}</span>
          <h2>{wish}</h2><OrnamentalRule />
          <div className="causal-chain">
            <div><small>{localized(locale, "AI读懂", "AI understands")}</small><strong>{locale === "zh" ? intent.nameZh : intent.nameEn}</strong></div>
            <i aria-hidden="true" />
            <div><small>{localized(locale, "你选择的花本", "Your chosen plan")}</small><strong>{locale === "zh" ? proposal.titleZh : proposal.titleEn}</strong></div>
          </div>
          <div className="craft-role"><strong>{locale === "zh" ? modeCopy.zh : modeCopy.en}</strong><span>{localized(locale, "数字协作示意，不是传统织机操作复原。", "A digital collaboration, not a reconstruction of loom operation.")}</span></div>
        </aside>
        <main className="loom-area">
          <button
            type="button"
            className={`lift-console${liftHeld ? " is-held" : ""}${warpReady ? " is-ready" : ""}`}
            disabled={weaveMode === "player-weaver" || paused || isCommitting}
            onPointerDown={startLift}
            onPointerUp={finishLift}
            onPointerCancel={finishLift}
            onLostPointerCapture={finishLift}
          >
            <span className="lift-role">{localized(locale, "拽花角色 · 提经", "Upper role · lift warps")}</span>
            <span className="warp-cue-lines" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</span>
            <strong>{liftStatus}</strong>
          </button>
          <div className="weave-frame"><WeaveCanvas matrix={matrix} palette={palette} recipe={recipe} completedRows={completedRows} committingRow={committingRow} direction={direction} locale={locale} /></div>
          <ol className="weave-stages" aria-label={localized(locale, "织造阶段", "Weaving stages")}>
            {STAGE_COPY.map((item, index) => <li key={item.en} className={index === activeStage ? "is-active" : index < activeStage ? "is-complete" : ""}><span />{locale === "zh" ? item.zh : item.en}</li>)}
          </ol>
          <div className={`shuttle-track ${direction}${canDragShuttle ? " is-ready" : ""}${aiSending ? " is-ai-sending" : ""}`} ref={trackRef}>
            <div className="track-dashes" aria-hidden="true" />
            {showFirstPassGuide ? <div className={`first-pass-guide${warpReady ? " is-ready" : ""}`} aria-hidden="true"><span className="first-pass-guide__trail" /><img src={shuttleAsset} alt="" /><span className="first-pass-guide__arrows">› › ›</span></div> : null}
            <img className="shuttle-handle" ref={shuttleRef} src={shuttleAsset} alt={localized(locale, "数字梭子", "Digital shuttle")} draggable="false" aria-disabled={!canDragShuttle} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={(event) => finishPointer(event)} onPointerCancel={(event) => finishPointer(event, true)} />
            <div className={`track-instruction${gestureFeedback ? " is-muted" : ""}`}><b>{weaveMode === "player-drawboy" ? localized(locale, "按住上方提经，AI送梭", "Hold above and AI sends") : weaveMode === "duo" ? localized(locale, "下方玩家同时沿纬向送梭", "Lower player sends while the cue is held") : warpReady ? localized(locale, "经线已提，沿纬向送梭", "Warps lifted; send the shuttle") : localized(locale, "等待AI完成提经", "Waiting for AI to lift warps")}</b></div>
            {gestureFeedback ? <div className="track-feedback" role="status" aria-live="polite"><span aria-hidden="true">↺</span>{gestureFeedbackCopy(locale, gestureFeedback, direction)}</div> : null}
          </div>
        </main>
        <aside className="motif-panel collaboration-panel">
          <span className="panel-label">{localized(locale, "此刻协作", "Collaboration now")}</span>
          <div className="collaboration-roles"><div><small>{localized(locale, "提经", "Warp lift")}</small><strong>{locale === "zh" ? modeCopy.upperZh : modeCopy.upperEn}</strong></div><i aria-hidden="true">×</i><div><small>{localized(locale, "送梭", "Weft pass")}</small><strong>{locale === "zh" ? modeCopy.lowerZh : modeCopy.lowerEn}</strong></div></div>
          <OrnamentalRule />
          <h3>{locale === "zh" ? stage.zh : stage.en}</h3>
          <p>{locale === "zh" ? stage.detailZh : stage.detailEn}</p>
          <span className="stage-pass-range">{activeStage * 6 + 1}–{Math.min(24, activeStage * 6 + 6)} / 24</span>
          <section className="weave-micro-tip" key={stageTip.id} aria-live="polite">
            <span>{locale === "zh" ? stageTip.eyebrowZh : stageTip.eyebrowEn}</span>
            <strong>{locale === "zh" ? stageTip.titleZh : stageTip.titleEn}</strong>
            <p>{locale === "zh" ? stageTip.bodyZh : stageTip.bodyEn}</p>
          </section>
          <button type="button" className="pause-button" aria-pressed={paused} aria-label={locale === "zh" ? (paused ? "继续织造" : "暂停织造") : (paused ? "Resume weaving" : "Pause weaving")} onClick={() => setPaused((value) => !value)}><PauseIcon /><span>{locale === "zh" ? (paused ? "继续" : "暂停") : (paused ? "Resume" : "Pause")}</span></button>
        </aside>
        {paused ? <div className="pause-overlay" role="status"><b>{localized(locale, "织机已暂停", "Loom paused")}</b></div> : null}
      </div>
      <Disclaimer locale={locale} />
    </section>
  );
}
