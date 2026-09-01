import { useEffect, useRef } from "react";
import type { Locale, Palette, PatternMatrix, PatternRecipe } from "../core/types";
import { paintActiveWeft, paintWovenMatrix } from "./weavePainter";
import { loadMotifAtlas, paintRefinedPattern, refinedPatternSignature } from "./refinedPattern";

interface WeaveCanvasProps {
  matrix: PatternMatrix;
  palette: Palette;
  recipe: PatternRecipe;
  completedRows: number;
  committingRow?: number;
  direction?: "ltr" | "rtl";
  locale?: Locale;
  className?: string;
}

function setupCanvas(canvas: HTMLCanvasElement): { context: CanvasRenderingContext2D; width: number; height: number } | null {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext("2d");
  return context ? { context, width, height } : null;
}

export function WeaveCanvas({ matrix, palette, recipe, completedRows, committingRow, direction = "ltr", locale = "zh", className }: WeaveCanvasProps) {
  const staticRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<HTMLCanvasElement>(null);
  const renderSignature = refinedPatternSignature(recipe, completedRows);

  useEffect(() => {
    const canvas = staticRef.current;
    if (!canvas) return;
    let active = true;
    const draw = () => {
      const setup = setupCanvas(canvas);
      if (!setup) return;
      paintWovenMatrix(setup.context, matrix, palette, setup.width, setup.height, { completedRows: 0 });
      loadMotifAtlas().then((atlas) => {
        if (!active) return;
        const latestSetup = setupCanvas(canvas);
        if (latestSetup) paintRefinedPattern(latestSetup.context, atlas, recipe, palette, latestSetup.width, latestSetup.height, { completedRows, glow: true });
      }).catch(() => {
        if (active) paintWovenMatrix(setup.context, matrix, palette, setup.width, setup.height, { completedRows });
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [matrix, palette, recipe, completedRows]);

  useEffect(() => {
    const canvas = animationRef.current;
    if (!canvas || committingRow === undefined) return;
    let frame = 0;
    const start = performance.now();
    const animate = (now: number) => {
      const setup = setupCanvas(canvas);
      if (!setup) return;
      const progress = Math.min(1, (now - start) / 320);
      paintActiveWeft(setup.context, setup.width, setup.height, committingRow, matrix.length, progress, direction);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else setup.context.clearRect(0, 0, setup.width, setup.height);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [committingRow, direction, matrix.length]);

  return (
    <div
      className={`weave-canvas ${className ?? ""}`}
      aria-label={locale === "zh" ? `已完成 ${completedRows} 梭，共 ${matrix.length} 梭` : `${completedRows} of ${matrix.length} passes completed`}
      data-render-signature={renderSignature}
    >
      <canvas ref={staticRef} />
      <canvas ref={animationRef} aria-hidden="true" />
    </div>
  );
}
