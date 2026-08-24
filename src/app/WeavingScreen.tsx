import { useCallback, useEffect, useRef, useState } from "react";
import shuttleAsset from "../assets/shuttle.png";
import { INTENT_COPY } from "../content/project";
import { MOTIFS, PALETTES } from "../content/motifs";
import { isValidWeaveGesture } from "../core/gesture";
import type { IntentId, Locale, PatternMatrix, PatternRecipe } from "../core/types";
import { WeaveCanvas } from "../render/WeaveCanvas";
import { Brand, Disclaimer, OrnamentalRule } from "./common";
import { PauseIcon } from "./icons";

interface WeavingScreenProps {
  locale: Locale;
  wish: string;
  primaryIntent: IntentId;
  matrix: PatternMatrix;
  recipe: PatternRecipe;
  completedRows: number;
  committingRow?: number;
  onCommit: () => void;
}

export function WeavingScreen({ locale, wish, primaryIntent, matrix, recipe, completedRows, committingRow, onCommit }: WeavingScreenProps) {
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const shuttleRef = useRef<HTMLImageElement>(null);
  const pointerId = useRef<number | null>(null);
  const invalidGesture = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const currentDelta = useRef(0);
  const direction = completedRows % 2 === 0 ? "ltr" : "rtl";
  const isCommitting = committingRow !== undefined;
  const palette = PALETTES[recipe.palette];
  const motif = MOTIFS[recipe.primaryMotif];
  const intent = INTENT_COPY[primaryIntent];

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
    const invalidateOnAdditionalPointer = (event: PointerEvent) => {
      if (pointerId.current !== null && pointerId.current !== event.pointerId) invalidGesture.current = true;
    };
    const cancelOnBlur = () => {
      if (pointerId.current === null) return;
      pointerId.current = null;
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
  }, [positionShuttle]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || isCommitting || paused) return;
      const valid = (direction === "ltr" && event.key === "ArrowRight") || (direction === "rtl" && event.key === "ArrowLeft");
      if (valid) onCommit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [direction, isCommitting, onCommit, paused]);

  const onPointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (isCommitting || paused || pointerId.current !== null) return;
    pointerId.current = event.pointerId;
    invalidGesture.current = false;
    start.current = { x: event.clientX, y: event.clientY };
    currentDelta.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-dragging");
  };
  const onPointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    if (pointerId.current !== event.pointerId || isCommitting || paused) return;
    const track = trackRef.current;
    const shuttle = shuttleRef.current;
    if (!track || !shuttle) return;
    const travel = Math.max(1, track.clientWidth - shuttle.clientWidth);
    const raw = event.clientX - start.current.x;
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
    const valid = isValidWeaveGesture({
      deltaX: currentDelta.current,
      deltaY: event.clientY - start.current.y,
      travel,
      trackHeight: track.clientHeight,
      direction,
      cancelled,
      multiPointer: invalidGesture.current,
    });
    if (valid) {
      positionShuttle(direction === "ltr" ? travel : -travel, true);
      onCommit();
    } else positionShuttle(0, true);
  };

  return (
    <section className="screen weaving-screen">
      <header className="weaving-header"><Brand compact /><div>共织 / Weave</div><div>第 <b>{Math.min(completedRows + 1, 24)}</b> / 24 梭</div></header>
      <div className={`weaving-layout${paused ? " is-paused" : ""}`}>
        <aside className="plan-panel">
          <h2>{wish}</h2><OrnamentalRule />
          <h3>AI意匠 / AI Pattern Plan</h3>
          <dl>
            <div><dt>心意</dt><dd>{intent.nameZh}</dd></div>
            <div><dt>构图</dt><dd>{recipe.layout === "continuous" ? "连续" : recipe.layout === "roundel" ? "团式" : recipe.layout === "scattered" ? "散点" : "组合"}</dd></div>
            <div><dt>色意</dt><dd>{palette.nameZh}</dd></div>
          </dl>
        </aside>
        <main className="loom-area">
          <div className="weave-frame">
            <WeaveCanvas matrix={matrix} palette={palette} completedRows={completedRows} committingRow={committingRow} direction={direction} />
          </div>
          <div className={`shuttle-track ${direction}`} ref={trackRef}>
            <div className="track-dashes" aria-hidden="true" />
            <img
              ref={shuttleRef}
              src={shuttleAsset}
              alt="数字梭子"
              draggable="false"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={(event) => finishPointer(event)}
              onPointerCancel={(event) => finishPointer(event, true)}
            />
            <div className="track-instruction"><b>沿丝路送梭</b><span>Slide to weave one row</span></div>
          </div>
        </main>
        <aside className="motif-panel">
          <div className="motif-orb" aria-hidden="true">◎</div>
          <h3>此刻织入：{motif.nameZh}</h3><OrnamentalRule />
          <p>{locale === "zh" ? motif.contemporaryMappingZh : motif.contemporaryMappingEn}</p>
          <button
            type="button"
            className="pause-button"
            aria-pressed={paused}
            aria-label={paused ? "继续织造" : "暂停织造"}
            onClick={() => setPaused((value) => !value)}
          >
            <PauseIcon /><span>{paused ? "继续 / Resume" : "暂停 / Pause"}</span>
          </button>
        </aside>
        {paused ? <div className="pause-overlay" role="status"><b>织机已暂停</b><span>Loom paused</span></div> : null}
      </div>
      <Disclaimer />
    </section>
  );
}
