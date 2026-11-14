import type { InkKind, Rect } from './inkLayer.ts';

/**
 * Traditional suminagashi trio: sumi black and indigo, separated by clear-water rings,
 * with a rare beni-red accent. The canvas multiply-blends over the washi paper, so these
 * read as pigment soaked into fibre rather than flat paint.
 */
export const INK_COLORS = {
  indigoDeep: '#14223f',
  indigoMid: '#2d4672',
  indigoPale: '#8394b4',
  sumi: '#16181d',
  sumiWash: '#5d626d',
  beni: '#b5372b',
} as const;

const RING_SEQUENCE: string[] = [
  INK_COLORS.indigoDeep,
  INK_COLORS.indigoPale,
  INK_COLORS.sumi,
  INK_COLORS.indigoMid,
  INK_COLORS.sumiWash,
  INK_COLORS.indigoDeep,
  INK_COLORS.sumi,
];

export const BENI_CHANCE = 0.07;

export type ScriptEvent =
  | { t: number; type: 'drop'; x: number; y: number; r: number; kind: InkKind; color: string }
  | { t: number; type: 'force'; x: number; y: number; vx: number; vy: number; radius: number };

/** Small, fast, seedable PRNG (mulberry32). */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cycles through ring colours for user drops, with the occasional beni accent. */
export class InkPicker {
  private idx: number;
  private rng: () => number;
  constructor(rng: () => number) {
    this.rng = rng;
    this.idx = Math.floor(rng() * RING_SEQUENCE.length);
  }
  next(): string {
    if (this.rng() < BENI_CHANCE) return INK_COLORS.beni;
    this.idx = (this.idx + 1) % RING_SEQUENCE.length;
    return RING_SEQUENCE[this.idx];
  }
}

/** Typical drop radius for a basin of this size, px. */
export function baseDropRadius(stage: Rect) {
  const w = stage.x1 - stage.x0;
  const h = stage.y1 - stage.y0;
  return Math.max(9, Math.min(30, Math.min(w, h) * 0.05));
}

/**
 * The opening performance, generated fresh each visit by the same physics the visitor plays with:
 * several drop sites build concentric rings, a few specks land, then two sweeping strokes
 * stir the water and the momentum curls everything into marbling.
 */
export function buildOpening(stage: Rect, rng: () => number): { events: ScriptEvent[]; duration: number } {
  const events: ScriptEvent[] = [];
  const w = stage.x1 - stage.x0;
  const h = stage.y1 - stage.y0;
  const r0 = baseDropRadius(stage);
  const rand = (a: number, b: number) => a + (b - a) * rng();

  const siteCount = w * h > 260_000 ? 4 : w * h > 110_000 ? 3 : 2;
  const sites: { x: number; y: number }[] = [];
  for (let s = 0; s < siteCount; s++) {
    // Spread sites down the stage with jitter so they never stack.
    const band = (s + 0.5) / siteCount;
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 12; tries++) {
      // Biased away from the stage's left edge, which borders the headline on desktop.
      x = stage.x0 + w * rand(0.32, 0.8);
      y = stage.y0 + h * Math.min(0.88, Math.max(0.12, band + rand(-0.12, 0.12)));
      const clear = sites.every((o) => Math.hypot(o.x - x, o.y - y) > Math.min(w, h) * 0.28);
      if (clear) break;
    }
    sites.push({ x, y });
  }

  let beniUsed = false;
  const beniSite = Math.floor(rng() * siteCount);

  sites.forEach((site, s) => {
    const t0 = 0.1 + s * 0.32 + rand(0, 0.12);
    const drops = Math.round(rand(9, 14));
    let colorIdx = Math.floor(rng() * RING_SEQUENCE.length);
    let t = t0;
    for (let d = 0; d < drops; d++) {
      const isInk = d % 2 === 0;
      let color: string = RING_SEQUENCE[colorIdx % RING_SEQUENCE.length];
      if (isInk) {
        colorIdx += 1 + Math.floor(rng() * 2);
        if (!beniUsed && s === beniSite && d >= 4 && rng() < 0.45) {
          color = INK_COLORS.beni;
          beniUsed = true;
        }
      }
      const scale = d === 0 ? 1.25 : isInk ? rand(0.75, 1.15) : rand(0.6, 1.0);
      events.push({
        t,
        type: 'drop',
        x: site.x + rand(-1.5, 1.5),
        y: site.y + rand(-1.5, 1.5),
        r: r0 * scale,
        kind: isInk ? 'ink' : 'clear',
        color,
      });
      t += rand(0.12, 0.19);
    }
  });

  // Specks: tiny stray drops that the stir draws out into hairline veins.
  const speckCount = Math.round(rand(7, 12));
  for (let k = 0; k < speckCount; k++) {
    events.push({
      t: rand(0.6, 2.1),
      type: 'drop',
      x: stage.x0 + w * rand(0.05, 0.95),
      y: stage.y0 + h * rand(0.05, 0.95),
      r: r0 * rand(0.18, 0.42),
      kind: 'ink',
      color: rng() < 0.5 ? INK_COLORS.sumi : INK_COLORS.indigoDeep,
    });
  }

  // Two stirring strokes: smooth cubic Béziers running the length of the stage and bending
  // through the drop sites, so the rings get drawn out but the ink stays in its own field.
  // A shallow band (the reviews masthead) shreds under two fast strokes; give it one slow one.
  const shallow = Math.min(w, h) < 320;
  const strokes = shallow ? 1 : 2;
  let strokeStart = 2.25;
  const tall = h >= w;
  const along = (a: number, b: number) =>
    tall
      ? { x: stage.x0 + w * a, y: stage.y0 + h * b }
      : { x: stage.x0 + w * b, y: stage.y0 + h * a };
  for (let sIdx = 0; sIdx < strokes; sIdx++) {
    const forward = (sIdx + (rng() < 0.5 ? 0 : 1)) % 2 === 0;
    const p0 = along(rand(0.3, 0.7), forward ? 0.04 : 0.96);
    const p3 = along(rand(0.3, 0.7), forward ? 0.96 : 0.04);
    const siteA = sites[Math.floor(rng() * sites.length)];
    const siteB = sites[Math.floor(rng() * sites.length)];
    const off = Math.min(w, h) * 0.12;
    const p1 = { x: siteA.x + rand(-off, off), y: siteA.y + rand(-off, off) };
    const p2 = { x: siteB.x + rand(-off, off), y: siteB.y + rand(-off, off) };
    if (tall ? (p1.y - p2.y) * (p0.y - p3.y) < 0 : (p1.x - p2.x) * (p0.x - p3.x) < 0) {
      const tmp = { ...p1 };
      p1.x = p2.x; p1.y = p2.y; p2.x = tmp.x; p2.y = tmp.y;
    }
    const duration = shallow ? rand(2.6, 3.2) : rand(1.4, 1.9);
    const steps = Math.round(duration * 60);
    const radius = Math.min(w, h) * 0.075;
    const bez = (t: number) => {
      const mt = 1 - t;
      return {
        x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
        y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
      };
    };
    for (let k = 0; k < steps; k++) {
      const a = bez(k / steps);
      const b = bez((k + 1) / steps);
      const dtStep = duration / steps;
      events.push({
        t: strokeStart + k * dtStep,
        type: 'force',
        x: a.x,
        y: a.y,
        vx: (b.x - a.x) / dtStep,
        vy: (b.y - a.y) / dtStep,
        radius,
      });
    }
    strokeStart += duration * rand(0.55, 0.85);
  }

  events.sort((a, b) => a.t - b.t);
  const last = events.length ? events[events.length - 1].t : 0;
  return { events, duration: last };
}
