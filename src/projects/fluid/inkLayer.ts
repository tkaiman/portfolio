import type { FlowField } from './flowField.ts';

/**
 * Suminagashi ink as geometry. Every drop is a closed polygon whose vertices ride the water.
 * Pigment is never resampled into pixels, so edges stay razor sharp no matter how long
 * the surface is stirred. Older drops are painted first; because the water's motion is a
 * bijection, each newer drop sits inside the hole it pushed into the older ink, so plain
 * painter's order reproduces the rings exactly.
 */

export type InkKind = 'ink' | 'clear';

export interface InkBlob {
  pts: Float32Array; // x0, y0, x1, y1, ...
  n: number; // vertex count
  kind: InkKind;
  color: string;
  alpha: number;
  fading: boolean;
}

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const BASE_MAX_EDGE = 2.4; // px between vertices on screen
const OFFSCREEN_MAX_EDGE = 28;
const MAX_EDGE_CAP = 9;

/** Signed shoelace area of a closed polygon. */
function polygonArea(pts: Float32Array, n: number) {
  let a = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    a += pts[j * 2] * pts[i * 2 + 1] - pts[i * 2] * pts[j * 2 + 1];
  }
  return a * 0.5;
}

export class InkLayer {
  blobs: InkBlob[] = [];
  totalVerts = 0;
  /** Bounds of the visible basin in sim coordinates; geometry outside it is kept coarse. */
  view: Rect;
  /** Soft vertex budget. Above it edges get longer (still crisp, slightly less curvy). */
  budget: number;
  maxBlobs: number;

  private maxEdge = BASE_MAX_EDGE;
  private scratch = new Float32Array(1 << 14);

  constructor(view: Rect, budget = 160_000, maxBlobs = 220) {
    this.view = view;
    this.budget = budget;
    this.maxBlobs = maxBlobs;
  }

  /** Start a new drop as a pin-prick circle; `push` then blooms it (and everything around it). */
  addDrop(cx: number, cy: number, kind: InkKind, color: string): InkBlob {
    // Seed circle: big enough that its vertex spacing survives the merge pass in `resample`
    // (a sub-pixel seed would collapse into a sliver before it blooms).
    const n = 20;
    const pts = new Float32Array(n * 2 * 2);
    const r0 = 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts[i * 2] = cx + Math.cos(a) * r0;
      pts[i * 2 + 1] = cy + Math.sin(a) * r0;
    }
    const blob: InkBlob = { pts, n, kind, color, alpha: 1, fading: false };
    this.blobs.push(blob);
    this.totalVerts += n;
    this.enforceLimits();
    return blob;
  }

  /**
   * Jaffer's exact area-preserving drop displacement, applied incrementally:
   * |p' - c|^2 = |p - c|^2 + dR2. Growing dR2 over a few frames makes the drop bloom.
   */
  push(cx: number, cy: number, dR2: number) {
    if (dR2 <= 0) return;
    for (const b of this.blobs) {
      const pts = b.pts;
      const len = b.n * 2;
      for (let k = 0; k < len; k += 2) {
        const dx = pts[k] - cx;
        const dy = pts[k + 1] - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 < 1e-8) continue;
        const s = Math.sqrt(1 + dR2 / d2);
        pts[k] = cx + dx * s;
        pts[k + 1] = cy + dy * s;
      }
    }
  }

  /** Carry every vertex with the water (midpoint RK2). */
  advect(field: FlowField, dt: number) {
    const { width, height } = field;
    for (const b of this.blobs) {
      const pts = b.pts;
      const len = b.n * 2;
      for (let k = 0; k < len; k += 2) {
        const x = pts[k];
        const y = pts[k + 1];
        // Ink pushed beyond the tray walls stays put; the water there is still.
        if (x < -2 || y < -2 || x > width + 2 || y > height + 2) continue;
        const u1 = field.sampleU(x, y);
        const v1 = field.sampleV(x, y);
        if (u1 * u1 + v1 * v1 < 1e-4) continue;
        const mx = x + 0.5 * dt * u1;
        const my = y + 0.5 * dt * v1;
        pts[k] = x + dt * field.sampleU(mx, my);
        pts[k + 1] = y + dt * field.sampleV(mx, my);
      }
    }
  }

  /** Scale all geometry, used when the basin is resized. */
  scale(sx: number, sy: number) {
    for (const b of this.blobs) {
      const len = b.n * 2;
      for (let k = 0; k < len; k += 2) {
        b.pts[k] *= sx;
        b.pts[k + 1] *= sy;
      }
    }
  }

  /**
   * Keep vertex spacing even: split long edges with Catmull-Rom midpoints (so curves stay
   * curves) and merge vertices that bunch up. Adapts edge length to the vertex budget.
   */
  resample() {
    if (this.totalVerts > this.budget) {
      // Coarsen faster the further over budget we are (a hard stir can double the count).
      const over = this.totalVerts / this.budget - 1;
      this.maxEdge = Math.min(MAX_EDGE_CAP, this.maxEdge * Math.min(1.25, 1.04 + over * 0.5));
    } else if (this.totalVerts < this.budget * 0.7 && this.maxEdge > BASE_MAX_EDGE) {
      this.maxEdge = Math.max(BASE_MAX_EDGE, this.maxEdge / 1.03);
    }

    const maxIn = this.maxEdge;
    const minIn = maxIn * 0.36;
    const v = this.view;
    const vx0 = v.x0 - 4;
    const vy0 = v.y0 - 4;
    const vx1 = v.x1 + 4;
    const vy1 = v.y1 + 4;

    let total = 0;
    const survivors: InkBlob[] = [];

    for (const b of this.blobs) {
      const n = b.n;
      const src = b.pts;
      let out = this.scratch;
      let m = 0; // floats written

      for (let i = 0; i < n; i++) {
        const i0 = (i - 1 + n) % n;
        const i2 = (i + 1) % n;
        const i3 = (i + 2) % n;
        const x0 = src[i0 * 2], y0 = src[i0 * 2 + 1];
        const x1 = src[i * 2], y1 = src[i * 2 + 1];
        const x2 = src[i2 * 2], y2 = src[i2 * 2 + 1];
        const x3 = src[i3 * 2], y3 = src[i3 * 2 + 1];

        const inside =
          (x1 > vx0 && x1 < vx1 && y1 > vy0 && y1 < vy1) ||
          (x2 > vx0 && x2 < vx1 && y2 > vy0 && y2 < vy1);
        const maxE = inside ? maxIn : OFFSCREEN_MAX_EDGE;
        const minE = inside ? minIn : OFFSCREEN_MAX_EDGE * 0.36;

        // Merge: drop this vertex if it sits too close to the last one we kept.
        if (m >= 2) {
          const dx = x1 - out[m - 2];
          const dy = y1 - out[m - 1];
          if (dx * dx + dy * dy < minE * minE) {
            continue;
          }
        }

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const segs = len > maxE ? Math.min(64, Math.ceil(len / maxE)) : 1;

        if (m + segs * 2 + 2 > out.length) {
          const grown = new Float32Array(Math.max(out.length * 2, m + segs * 2 + 1024));
          grown.set(out.subarray(0, m));
          out = grown;
          this.scratch = grown;
        }

        out[m++] = x1;
        out[m++] = y1;

        for (let s = 1; s < segs; s++) {
          const t = s / segs;
          const t2 = t * t;
          const t3 = t2 * t;
          out[m++] =
            0.5 *
            (2 * x1 +
              (-x0 + x2) * t +
              (2 * x0 - 5 * x1 + 4 * x2 - x3) * t2 +
              (-x0 + 3 * x1 - 3 * x2 + x3) * t3);
          out[m++] =
            0.5 *
            (2 * y1 +
              (-y0 + y2) * t +
              (2 * y0 - 5 * y1 + 4 * y2 - y3) * t2 +
              (-y0 + 3 * y1 - 3 * y2 + y3) * t3);
        }
      }

      const newN = m >> 1;
      if (newN < 3) continue; // collapsed to nothing

      if (b.pts.length < m || b.pts.length > m * 4) {
        b.pts = new Float32Array(Math.ceil(m * 1.5) + 16);
      }
      b.pts.set(out.subarray(0, m));
      b.n = newN;
      total += newN;
      survivors.push(b);
    }

    this.blobs = survivors;
    this.totalVerts = total;
    this.enforceLimits();
  }

  /** Advance fade-outs of retired drops. Returns true while anything is still fading. */
  updateFades(dt: number): boolean {
    let any = false;
    for (const b of this.blobs) {
      if (!b.fading) continue;
      // Quick: a half-transparent drop reads as grey wash, which is exactly what we avoid.
      b.alpha -= dt / 0.8;
      any = true;
    }
    if (any) {
      this.blobs = this.blobs.filter((b) => b.alpha > 0);
      this.trimLeadingClear();
    }
    return any;
  }

  clear() {
    this.blobs = [];
    this.totalVerts = 0;
    this.maxEdge = BASE_MAX_EDGE;
  }

  /**
   * Draw into a 2D context already transformed into sim coordinates.
   * Clear-water drops punch holes (destination-out) through older ink so the paper shows.
   */
  draw(ctx: CanvasRenderingContext2D) {
    for (const b of this.blobs) {
      const pts = b.pts;
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      const len = b.n * 2;
      for (let k = 2; k < len; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
      ctx.closePath();
      ctx.globalAlpha = Math.max(0, Math.min(1, b.alpha));
      if (b.kind === 'clear') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fill();
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = b.color;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Retire the oldest drops when the basin gets too busy, so it never bogs down. */
  private enforceLimits() {
    let activeCount = 0;
    let activeVerts = 0;
    for (const b of this.blobs) {
      if (b.fading) continue;
      activeCount++;
      activeVerts += b.n;
    }
    // Too many drops: the oldest dissolve first.
    let over = activeCount - this.maxBlobs;
    for (const b of this.blobs) {
      if (over <= 0) break;
      if (b.fading) continue;
      b.fading = true;
      over--;
      activeVerts -= b.n;
    }

    // Stirring stretches outlines exponentially, so a hard vertex budget is unavoidable.
    // Retiring ink is the last resort (only once edges are as coarse as they go), and it takes
    // the most thread-like drops first: they hold most of the vertices but cover little paper,
    // so the composition keeps its big shapes while the finest veins fade away.
    const coarsest = this.maxEdge >= MAX_EDGE_CAP * 0.99;
    const runaway = activeVerts > this.budget * 2.5; // don't wait for coarsening to catch up
    let vertExcess =
      (coarsest && activeVerts > this.budget * 1.2) || runaway ? activeVerts - this.budget : 0;
    if (vertExcess > 0) {
      const ranked = this.blobs
        .filter((b) => !b.fading)
        .map((b) => ({ b, thin: b.n / Math.sqrt(Math.abs(polygonArea(b.pts, b.n)) + 1) }))
        .sort((p, q) => q.thin - p.thin);
      for (const { b } of ranked) {
        if (vertExcess <= 0) break;
        b.fading = true;
        vertExcess -= b.n;
      }
    }
    this.trimLeadingClear();
  }

  /** A clear drop with nothing older beneath it has nothing to erase. */
  private trimLeadingClear() {
    while (this.blobs.length && this.blobs[0].kind === 'clear') {
      this.totalVerts -= this.blobs[0].n;
      this.blobs.shift();
    }
  }
}
