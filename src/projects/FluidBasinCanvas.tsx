import React, { useEffect, useRef } from 'react';
import type { FluidMode } from './Landing.tsx';
import { FlowField } from './fluid/flowField.ts';
import { InkLayer, type InkKind, type Rect } from './fluid/inkLayer.ts';
import { InkPicker, baseDropRadius, buildOpening, makeRng, type ScriptEvent } from './fluid/opening.ts';

interface FluidBasinCanvasProps {
  fluidMode: FluidMode;
  viscosity: number;
  dropPulseCount: number;
  variant: 'home' | 'masthead';
  onFlowChange?: (flowNormalized: number) => void;
}

interface Bloom {
  x: number;
  y: number;
  r2: number; // target radius squared
  done: number; // radius squared already applied
  start: number; // sim seconds
  dur: number;
}

interface PendingDrop {
  at: number; // sim seconds
  x: number;
  y: number;
  r: number;
  kind: InkKind;
  color: string;
}

const MOBILE_BREAKPOINT = 960;
const MAX_DT = 1 / 30;
const FIXED_DT = 1 / 60;

/** Basin bounds within the canvas (px), and where the ink composition lives inside it. */
function computeLayout(variant: 'home' | 'masthead', w: number, h: number) {
  const isMobile = w <= MOBILE_BREAKPOINT;
  let basinX0 = 0;
  let basinX1 = w;
  if (variant === 'home' && !isMobile) {
    basinX0 = Math.round(w * 0.1047);
    basinX1 = Math.round(w * 0.923);
  }
  const bw = basinX1 - basinX0;

  let stage: Rect;
  if (variant === 'masthead') {
    const sw = Math.min(560, w * 0.52);
    stage = { x0: bw - sw, y0: 0, x1: bw, y1: h };
  } else if (isMobile) {
    const y0 = 40;
    stage = { x0: bw * 0.36, y0, x1: bw, y1: Math.min(h, y0 + 380) };
  } else {
    // Right-hand marbling field (46%..92% of the page), clear of the headline copy.
    stage = { x0: w * 0.4615 - basinX0, y0: 0, x1: bw, y1: h };
  }
  return { isMobile, basinX0, basinX1, basinW: bw, stage };
}

const FluidBasinCanvas: React.FC<FluidBasinCanvasProps> = ({
  fluidMode,
  viscosity,
  dropPulseCount,
  variant,
  onFlowChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef<FluidMode>(fluidMode);
  const viscRef = useRef<number>(viscosity);
  const flowCbRef = useRef(onFlowChange);
  const wakeRef = useRef<() => void>(() => {});
  const dropRequestRef = useRef<() => void>(() => {});
  const lastDropPulseRef = useRef<number>(dropPulseCount);

  modeRef.current = fluidMode;
  viscRef.current = viscosity;
  flowCbRef.current = onFlowChange;

  // Mode / viscosity changes may need the loop running (e.g. FAN starts the breeze).
  useEffect(() => {
    wakeRef.current();
  }, [fluidMode, viscosity]);

  // The left-rail DROP button lands a ring somewhere in the composition.
  useEffect(() => {
    if (dropPulseCount > lastDropPulseRef.current) dropRequestRef.current();
    lastDropPulseRef.current = dropPulseCount;
  }, [dropPulseCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rng = makeRng((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0);
    const picker = new InkPicker(rng);

    let cssW = Math.max(1, parent.clientWidth);
    let cssH = Math.max(1, parent.clientHeight);
    let layout = computeLayout(variant, cssW, cssH);
    let field = new FlowField(layout.basinW, cssH);
    const ink = new InkLayer(
      { x0: 0, y0: 0, x1: layout.basinW, y1: cssH },
      layout.isMobile || variant === 'masthead' ? 45_000 : 75_000
    );
    let dpr = 1;

    let simTime = 0;
    let resampleTick = 0;
    const blooms: Bloom[] = [];
    const pending: PendingDrop[] = [];
    let script: ScriptEvent[] = [];
    let scriptIdx = 0;
    let dirty = true;

    const sizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
    };
    sizeCanvas();

    // ---------- physics helpers ----------

    const startDrop = (x: number, y: number, r: number, kind: InkKind, color: string) => {
      ink.addDrop(x, y, kind, color);
      const dur = 0.28 + Math.min(0.32, r / 90);
      blooms.push({ x, y, r2: r * r, done: 0, start: simTime, dur });
      dirty = true;
    };

    /** A click: an ink drop, then a clear drop in its heart, leaving a ring. */
    const queueRing = (x: number, y: number, scale = 1) => {
      const r = baseDropRadius(layout.stage) * scale * (0.8 + rng() * 0.45);
      pending.push({ at: simTime, x, y, r, kind: 'ink', color: picker.next() });
      pending.push({ at: simTime + 0.11, x, y, r: r * (0.62 + rng() * 0.2), kind: 'clear', color: '' });
    };

    const runBlooms = () => {
      for (let i = blooms.length - 1; i >= 0; i--) {
        const b = blooms[i];
        const p = Math.min(1, (simTime - b.start) / b.dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const target = b.r2 * eased;
        ink.push(b.x, b.y, target - b.done);
        b.done = target;
        if (p >= 1) blooms.splice(i, 1);
      }
    };

    const runScript = () => {
      while (scriptIdx < script.length && script[scriptIdx].t <= simTime) {
        const e = script[scriptIdx++];
        if (e.type === 'drop') startDrop(e.x, e.y, e.r, e.kind, e.color);
        else field.splat(e.x, e.y, e.vx, e.vy, e.radius, 0.32, true);
      }
      for (let i = pending.length - 1; i >= 0; i--) {
        const d = pending[i];
        if (d.at <= simTime) {
          pending.splice(i, 1);
          startDrop(d.x, d.y, d.r, d.kind, d.color);
        }
      }
    };

    const fanBreeze = () => {
      const t = simTime;
      const { stage } = layout;
      const sw = stage.x1 - stage.x0;
      const sh = stage.y1 - stage.y0;
      const gust = Math.max(0.25, 1 - viscRef.current * 1.8);
      const x = stage.x0 + sw * (0.5 + 0.32 * Math.sin(t * 0.37));
      const y = stage.y0 + sh * (0.5 + 0.34 * Math.cos(t * 0.29));
      const speed = Math.min(sw, sh) * 0.32 * gust;
      field.splat(x, y, Math.cos(t * 0.21) * speed, Math.sin(t * 0.33) * speed, Math.min(sw, sh) * 0.16, 0.05, true);
    };

    const physicsStep = (dt: number) => {
      simTime += dt;
      runScript();
      if (modeRef.current === 'fan') fanBreeze();

      const visc = viscRef.current; // 0.05 .. 0.37
      const still = modeRef.current === 'still';
      const damping = still ? 7 : 0.35 + visc * 4.2;
      const vort = still ? 0 : Math.max(0.3, 1.6 - visc * 4);
      field.step(dt, damping, vort, Math.max(cssH, layout.basinW) * 1.3);

      runBlooms();
      let moved = false;
      if (field.maxSpeed > 0.4) {
        ink.advect(field, dt);
        dirty = true;
        moved = true;
      }
      // Blooms reshape every drop each step; plain advection only stretches edges a few px per
      // step, so resampling every other step keeps them even at half the cost.
      resampleTick++;
      if (blooms.length || (moved && resampleTick % 2 === 0)) ink.resample();
      if (ink.updateFades(dt)) dirty = true;
    };

    // ---------- rendering ----------

    const render = () => {
      const { basinX0, basinW, isMobile } = layout;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, basinX0 * dpr, 0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, basinW, cssH);
      ctx.clip();
      ink.draw(ctx);

      // Lift ink away from the headline so stirred pigment never fights the copy.
      if (variant === 'home' && !isMobile) {
        const cx = cssW * 0.29 - basinX0;
        const cy = cssH * 0.3;
        const rx = cssW * 0.24;
        const ry = cssH * 0.27;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.translate(cx, cy);
        ctx.scale(rx / ry, 1);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
        g.addColorStop(0, 'rgba(0,0,0,0.7)');
        g.addColorStop(0.6, 'rgba(0,0,0,0.55)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-ry, -ry, ry * 2, ry * 2);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
      dirty = false;
    };

    // ---------- opening performance ----------

    const opening = buildOpening(layout.stage, rng);
    script = opening.events;
    if (reducedMotion) {
      // Same physics, fast-forwarded: the visitor sees the finished composition at once.
      const settle = opening.duration + 3.5;
      while (simTime < settle) physicsStep(FIXED_DT);
      field.reset();
      render();
    }

    // ---------- pointer interaction ----------

    const ptr = {
      down: false,
      id: -1,
      stirring: false,
      dripping: false,
      downX: 0,
      downY: 0,
      prevX: 0,
      prevY: 0,
      prevT: 0,
      hoverValid: false,
      dripTimer: 0 as number | ReturnType<typeof setTimeout>,
      dripKind: 'ink' as InkKind,
    };

    const toSim = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const sx = rect.width > 0 ? cssW / rect.width : 1;
      const sy = rect.height > 0 ? cssH / rect.height : 1;
      const x = (clientX - rect.left) * sx - layout.basinX0;
      const y = (clientY - rect.top) * sy;
      const inside = x >= 0 && x <= layout.basinW && y >= 0 && y <= cssH;
      return { x, y, inside };
    };

    const isControl = (target: EventTarget | null) =>
      Boolean((target as HTMLElement | null)?.closest?.('a, button, input, label, select, textarea'));

    const stopDrip = () => {
      if (ptr.dripTimer) clearTimeout(ptr.dripTimer);
      ptr.dripTimer = 0;
    };

    const drip = () => {
      if (!ptr.down || ptr.stirring) return;
      ptr.dripping = true;
      const r = baseDropRadius(layout.stage) * (ptr.dripKind === 'ink' ? 0.7 + rng() * 0.4 : 0.55 + rng() * 0.3);
      startDrop(ptr.downX, ptr.downY, r, ptr.dripKind, ptr.dripKind === 'ink' ? picker.next() : '');
      ptr.dripKind = ptr.dripKind === 'ink' ? 'clear' : 'ink';
      wake();
      ptr.dripTimer = setTimeout(drip, 210);
    };

    const stir = (x: number, y: number, now: number, strength: number, radiusScale: number) => {
      const dt = Math.max(0.008, Math.min(0.06, (now - ptr.prevT) / 1000));
      const dx = x - ptr.prevX;
      const dy = y - ptr.prevY;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.5) return;
      // A flick should swirl, not shred: cap the hand speed the water is asked to match.
      const cap = Math.min(cssH, layout.basinW) * 1.4;
      const k = Math.min(1, cap / (dist / dt));
      const vx = (dx / dt) * k;
      const vy = (dy / dt) * k;
      const radius = Math.max(14, Math.min(cssH, layout.basinW) * 0.045) * radiusScale;
      const steps = Math.min(12, Math.max(1, Math.ceil(dist / (radius * 0.5))));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        field.splat(ptr.prevX + dx * t, ptr.prevY + dy * t, vx, vy, radius, strength / Math.sqrt(steps), true);
      }
      wake();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (isControl(e.target)) return;
      const p = toSim(e.clientX, e.clientY);
      if (!p.inside) return;
      if (e.pointerType === 'mouse') {
        e.preventDefault();
        window.getSelection()?.removeAllRanges();
      }
      ptr.down = true;
      ptr.id = e.pointerId;
      ptr.stirring = false;
      ptr.dripping = false;
      ptr.dripKind = 'ink';
      ptr.downX = ptr.prevX = p.x;
      ptr.downY = ptr.prevY = p.y;
      ptr.prevT = performance.now();
      parent.classList.add('is-dragging-fluid');
      stopDrip();
      ptr.dripTimer = setTimeout(drip, 260);
    };

    const onPointerMove = (e: PointerEvent) => {
      const p = toSim(e.clientX, e.clientY);
      const now = performance.now();
      const mode = modeRef.current;

      if (ptr.down && e.pointerId === ptr.id) {
        if (!ptr.stirring && Math.hypot(p.x - ptr.downX, p.y - ptr.downY) > 7) {
          ptr.stirring = true;
          stopDrip();
        }
        if (ptr.stirring && mode !== 'still') stir(p.x, p.y, now, 0.55, 1);
        ptr.prevX = p.x;
        ptr.prevY = p.y;
        ptr.prevT = now;
        return;
      }

      // A light wake follows the cursor as it glides over the water.
      if (!p.inside || mode === 'still' || e.pointerType !== 'mouse') {
        ptr.hoverValid = false;
        return;
      }
      if (ptr.hoverValid) stir(p.x, p.y, now, 0.07, 0.8);
      ptr.prevX = p.x;
      ptr.prevY = p.y;
      ptr.prevT = now;
      ptr.hoverValid = true;
    };

    const endPointer = (e: PointerEvent, cancelled: boolean) => {
      if (!ptr.down || e.pointerId !== ptr.id) return;
      ptr.down = false;
      stopDrip();
      parent.classList.remove('is-dragging-fluid');
      if (!cancelled && !ptr.stirring && !ptr.dripping) {
        queueRing(ptr.downX, ptr.downY);
        wake();
      }
      ptr.hoverValid = false;
    };
    const onPointerUp = (e: PointerEvent) => endPointer(e, false);
    const onPointerCancel = (e: PointerEvent) => endPointer(e, true);

    dropRequestRef.current = () => {
      const { stage } = layout;
      const x = stage.x0 + (stage.x1 - stage.x0) * (0.2 + rng() * 0.6);
      const y = stage.y0 + (stage.y1 - stage.y0) * (0.2 + rng() * 0.6);
      queueRing(x, y, 1.25);
      wake();
    };

    parent.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerCancel, { passive: true });

    // ---------- resize ----------

    const ro = new ResizeObserver(() => {
      const w = Math.max(1, parent.clientWidth);
      const h = Math.max(1, parent.clientHeight);
      if (w === cssW && h === cssH) return;
      const next = computeLayout(variant, w, h);
      ink.scale(next.basinW / layout.basinW, h / cssH);
      cssW = w;
      cssH = h;
      layout = next;
      field = new FlowField(layout.basinW, cssH);
      ink.view = { x0: 0, y0: 0, x1: layout.basinW, y1: cssH };
      sizeCanvas();
      ink.resample();
      render();
    });
    ro.observe(parent);

    // ---------- main loop: sleeps whenever the water is calm ----------

    let rafId = 0;
    let lastFrame = 0;
    let disposed = false;
    let inViewport = true;
    let tabVisible = !document.hidden;
    let accumulator = 0;
    let lastFlowReport = 0;
    let lastFlowValue = -1;

    const isBusy = () =>
      scriptIdx < script.length ||
      pending.length > 0 ||
      blooms.length > 0 ||
      field.maxSpeed > 0.4 ||
      modeRef.current === 'fan' ||
      ink.blobs.some((b) => b.fading);

    const reportFlow = (now: number) => {
      const cb = flowCbRef.current;
      if (!cb || now - lastFlowReport < 90) return;
      const scale = Math.max(1, Math.min(cssH, layout.basinW)) * 0.9;
      const flow = 0.06 + 0.86 * (1 - Math.exp(-field.maxSpeed / scale));
      if (Math.abs(flow - lastFlowValue) < 0.004) return;
      lastFlowValue = flow;
      lastFlowReport = now;
      cb(flow);
    };

    const frame = (now: number) => {
      rafId = 0;
      if (disposed || !inViewport || !tabVisible) return;
      const elapsed = lastFrame ? Math.min(MAX_DT * 2, (now - lastFrame) / 1000) : FIXED_DT;
      lastFrame = now;

      // Fixed sub-steps keep the solver stable on high-refresh and janky frames alike.
      accumulator += elapsed;
      let steps = 0;
      while (accumulator >= FIXED_DT && steps < 3) {
        physicsStep(FIXED_DT);
        accumulator -= FIXED_DT;
        steps++;
      }
      if (steps === 3) accumulator = 0;

      if (dirty) render();
      reportFlow(now);

      if (isBusy()) {
        rafId = requestAnimationFrame(frame);
      } else {
        lastFrame = 0;
        accumulator = 0;
        reportFlow(now + 1000);
      }
    };

    const wake = () => {
      if (!rafId && !disposed && inViewport && tabVisible) {
        rafId = requestAnimationFrame(frame);
      }
    };
    wakeRef.current = wake;

    const io = new IntersectionObserver(
      (entries) => {
        inViewport = entries.some((entry) => entry.isIntersecting);
        if (inViewport) wake();
        else lastFrame = 0;
      },
      { threshold: 0.01 }
    );
    io.observe(parent);

    const onVisibility = () => {
      tabVisible = !document.hidden;
      lastFrame = 0;
      if (tabVisible) wake();
    };
    document.addEventListener('visibilitychange', onVisibility);

    render();
    wake();

    // Dev-only: step the physics synchronously (for testing in throttled/hidden tabs).
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__suminagashi = {
        advance(seconds: number) {
          const t0 = performance.now();
          const steps = Math.round(seconds / FIXED_DT);
          for (let i = 0; i < steps; i++) physicsStep(FIXED_DT);
          const t1 = performance.now();
          render();
          const t2 = performance.now();
          return {
            simTime: +simTime.toFixed(2),
            msPerStep: +((t1 - t0) / Math.max(1, steps)).toFixed(2),
            msRender: +(t2 - t1).toFixed(2),
            blobs: ink.blobs.length,
            verts: ink.totalVerts,
            maxSpeed: Math.round(field.maxSpeed),
            relDiv: +field.relativeDivergence().toFixed(4),
            grid: `${field.nx}x${field.ny}`,
            // Signed area of each ink polygon; should stay put as the water moves.
            areas: ink.blobs.slice(0, 4).map((b) => {
              let a = 0;
              for (let i = 0; i < b.n; i++) {
                const j = (i + 1) % b.n;
                a += b.pts[i * 2] * b.pts[j * 2 + 1] - b.pts[j * 2] * b.pts[i * 2 + 1];
              }
              return Math.round(Math.abs(a) / 2);
            }),
          };
        },
        drop(x: number, y: number) {
          queueRing(x, y);
        },
        stir(x0: number, y0: number, x1: number, y1: number, seconds: number) {
          const steps = Math.round(seconds / FIXED_DT);
          for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const vx = (x1 - x0) / seconds;
            const vy = (y1 - y0) / seconds;
            field.splat(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, vx, vy, Math.min(cssH, layout.basinW) * 0.045, 0.55, true);
            physicsStep(FIXED_DT);
          }
          render();
        },
        layout: () => layout,
        blobStats: () =>
          ink.blobs
            .map((b, idx) => {
              let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, per = 0;
              for (let i = 0; i < b.n; i++) {
                const x = b.pts[i * 2], y = b.pts[i * 2 + 1];
                x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
                const j = (i + 1) % b.n;
                per += Math.hypot(b.pts[j * 2] - x, b.pts[j * 2 + 1] - y);
              }
              return { idx, kind: b.kind, n: b.n, per: Math.round(per), box: [x0, y0, x1, y1].map(Math.round) };
            })
            .sort((a, b) => b.n - a.n)
            .slice(0, 8),
      };
    }

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      stopDrip();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      parent.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      parent.classList.remove('is-dragging-fluid');
      wakeRef.current = () => {};
      dropRequestRef.current = () => {};
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className={`suminagashi-live-canvas suminagashi-live-canvas--${variant}`}
      aria-hidden="true"
    />
  );
};

export default FluidBasinCanvas;
