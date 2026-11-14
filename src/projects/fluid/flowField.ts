/**
 * Incompressible 2D water surface: a "stable fluids" solver on a staggered (MAC) grid.
 *
 * Units are CSS pixels and seconds. The solver only carries *momentum*; it never touches ink
 * pixels, so its coarse resolution reads as gentle viscous water rather than blur.
 *
 * Layout:
 *   u[i + j*(nx+1)]  horizontal velocity on vertical cell faces at (i*hx, (j+0.5)*hy)
 *   v[i + j*nx]      vertical velocity on horizontal cell faces at ((i+0.5)*hx, j*hy)
 *   p[i + j*nx]      pressure at cell centres
 * Walls on all four sides are free-slip (zero normal velocity).
 */
export class FlowField {
  readonly width: number;
  readonly height: number;
  readonly nx: number;
  readonly ny: number;
  readonly hx: number;
  readonly hy: number;

  u: Float32Array;
  v: Float32Array;
  private u0: Float32Array;
  private v0: Float32Array;
  private p: Float32Array;
  private div: Float32Array;
  private curl: Float32Array;
  private fx: Float32Array;
  private fy: Float32Array;

  /** Largest face speed after the last step, px/s. Used for sleep detection and telemetry. */
  maxSpeed = 0;

  constructor(width: number, height: number, targetCells = 6500) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    const aspect = this.width / this.height;
    this.ny = Math.max(16, Math.min(110, Math.round(Math.sqrt(targetCells / aspect))));
    this.nx = Math.max(16, Math.min(220, Math.round(this.ny * aspect)));
    this.hx = this.width / this.nx;
    this.hy = this.height / this.ny;

    const { nx, ny } = this;
    this.u = new Float32Array((nx + 1) * ny);
    this.u0 = new Float32Array((nx + 1) * ny);
    this.v = new Float32Array(nx * (ny + 1));
    this.v0 = new Float32Array(nx * (ny + 1));
    this.p = new Float32Array(nx * ny);
    this.div = new Float32Array(nx * ny);
    this.curl = new Float32Array(nx * ny);
    this.fx = new Float32Array(nx * ny);
    this.fy = new Float32Array(nx * ny);
  }

  sampleU(x: number, y: number, field: Float32Array = this.u): number {
    const { nx, ny } = this;
    let fx = x / this.hx;
    let fy = y / this.hy - 0.5;
    if (fx < 0) fx = 0;
    else if (fx > nx) fx = nx;
    if (fy < 0) fy = 0;
    else if (fy > ny - 1) fy = ny - 1;
    let i = fx | 0;
    let j = fy | 0;
    if (i > nx - 1) i = nx - 1;
    if (j > ny - 2) j = ny - 2;
    const tx = fx - i;
    const ty = fy - j;
    const s = nx + 1;
    const k = i + j * s;
    const a = field[k] + (field[k + 1] - field[k]) * tx;
    const b = field[k + s] + (field[k + s + 1] - field[k + s]) * tx;
    return a + (b - a) * ty;
  }

  sampleV(x: number, y: number, field: Float32Array = this.v): number {
    const { nx, ny } = this;
    let fx = x / this.hx - 0.5;
    let fy = y / this.hy;
    if (fx < 0) fx = 0;
    else if (fx > nx - 1) fx = nx - 1;
    if (fy < 0) fy = 0;
    else if (fy > ny) fy = ny;
    let i = fx | 0;
    let j = fy | 0;
    if (i > nx - 2) i = nx - 2;
    if (j > ny - 1) j = ny - 1;
    const tx = fx - i;
    const ty = fy - j;
    const k = i + j * nx;
    const a = field[k] + (field[k + 1] - field[k]) * tx;
    const b = field[k + nx] + (field[k + nx + 1] - field[k + nx]) * tx;
    return a + (b - a) * ty;
  }

  /** Set whenever an external force touches the water; cleared by `step`. */
  touched = false;

  /**
   * Push water near (x, y) like a stick drawn through it. The impulse is built from a stream
   * function ψ = (D × r)·exp(-|r|²/R²) sampled on cell corners, so it is *exactly* divergence-free
   * on the MAC grid: water moves forward at the centre and returns around the sides, never
   * piling up or draining away (which would swell or shrink the ink).
   *
   * With blend=true the water under the stick is pulled toward (vx, vy) by `strength`;
   * otherwise (vx, vy)·strength is added on top of the existing momentum.
   */
  splat(x: number, y: number, vx: number, vy: number, radius: number, strength: number, blend = true) {
    const { nx, ny, hx, hy } = this;
    let dx = vx * strength;
    let dy = vy * strength;
    if (blend) {
      const k = Math.min(1, strength);
      dx = (vx - this.sampleU(x, y)) * k;
      dy = (vy - this.sampleV(x, y)) * k;
    }
    if (dx * dx + dy * dy < 1e-6) return;

    const r2 = radius * radius;
    const reach = radius * 2.6;
    const i0 = Math.max(0, Math.floor((x - reach) / hx));
    const i1 = Math.min(nx, Math.ceil((x + reach) / hx));
    const j0 = Math.max(0, Math.floor((y - reach) / hy));
    const j1 = Math.min(ny, Math.ceil((y + reach) / hy));
    const cw = i1 - i0 + 1;
    const ch = j1 - j0 + 1;
    const psi = new Float32Array(cw * ch);

    for (let j = j0; j <= j1; j++) {
      const ry = j * hy - y;
      for (let i = i0; i <= i1; i++) {
        // Corners on the walls keep ψ = 0 so no water crosses the tray edge.
        if (i === 0 || i === nx || j === 0 || j === ny) continue;
        const rx = i * hx - x;
        const g = Math.exp(-(rx * rx + ry * ry) / r2);
        psi[i - i0 + (j - j0) * cw] = (dx * ry - dy * rx) * g;
      }
    }

    const s = nx + 1;
    // u = ∂ψ/∂y on vertical faces, between corners (i, j) and (i, j+1).
    for (let j = j0; j < j1; j++) {
      if (j >= ny) break;
      for (let i = i0; i <= i1; i++) {
        const a = psi[i - i0 + (j - j0) * cw];
        const b = psi[i - i0 + (j + 1 - j0) * cw];
        this.u[i + j * s] += (b - a) / hy;
      }
    }
    // v = -∂ψ/∂x on horizontal faces, between corners (i, j) and (i+1, j).
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i < i1; i++) {
        if (i >= nx) break;
        const a = psi[i - i0 + (j - j0) * cw];
        const b = psi[i + 1 - i0 + (j - j0) * cw];
        this.v[i + j * nx] -= (b - a) / hx;
      }
    }
    this.touched = true;
  }

  /** One solver step: vorticity confinement → self-advection → damping → pressure projection. */
  step(dt: number, damping: number, vorticity: number, maxVelocity: number) {
    // Calm water with nothing touching it: sleep.
    if (!this.touched && this.maxSpeed < 0.3) {
      this.maxSpeed = 0;
      return;
    }
    this.touched = false;
    if (vorticity > 0) this.confineVorticity(dt, vorticity);
    this.advectVelocity(dt);

    const keep = Math.exp(-damping * dt);
    const { u, v } = this;
    for (let k = 0; k < u.length; k++) {
      let val = u[k] * keep;
      if (val > maxVelocity) val = maxVelocity;
      else if (val < -maxVelocity) val = -maxVelocity;
      u[k] = val;
    }
    for (let k = 0; k < v.length; k++) {
      let val = v[k] * keep;
      if (val > maxVelocity) val = maxVelocity;
      else if (val < -maxVelocity) val = -maxVelocity;
      v[k] = val;
    }

    this.project(40);

    let m = 0;
    for (let k = 0; k < u.length; k++) {
      const a = u[k] < 0 ? -u[k] : u[k];
      if (a > m) m = a;
    }
    for (let k = 0; k < v.length; k++) {
      const a = v[k] < 0 ? -v[k] : v[k];
      if (a > m) m = a;
    }
    this.maxSpeed = m;
  }

  /** Largest |∇·u| relative to typical speed / cell size (diagnostic; ~0 means incompressible). */
  relativeDivergence(): number {
    const { nx, ny, hx, hy, u, v } = this;
    const s = nx + 1;
    let m = 0;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const d = Math.abs((u[i + 1 + j * s] - u[i + j * s]) / hx + (v[i + (j + 1) * nx] - v[i + j * nx]) / hy);
        if (d > m) m = d;
      }
    }
    return this.maxSpeed > 0 ? (m * Math.min(hx, hy)) / this.maxSpeed : 0;
  }

  /** Zero all motion, e.g. after a resize. */
  reset() {
    this.u.fill(0);
    this.v.fill(0);
    this.p.fill(0);
    this.maxSpeed = 0;
  }

  private advectVelocity(dt: number) {
    const { nx, ny, hx, hy, u, v, u0, v0 } = this;
    const s = nx + 1;

    for (let j = 0; j < ny; j++) {
      const y = (j + 0.5) * hy;
      for (let i = 1; i < nx; i++) {
        const x = i * hx;
        const k = i + j * s;
        const ux = u[k];
        const vy = this.sampleV(x, y);
        const mx = x - 0.5 * dt * ux;
        const my = y - 0.5 * dt * vy;
        const sx = x - dt * this.sampleU(mx, my);
        const sy = y - dt * this.sampleV(mx, my);
        u0[k] = this.sampleU(sx, sy);
      }
      u0[j * s] = 0;
      u0[nx + j * s] = 0;
    }

    for (let j = 1; j < ny; j++) {
      const y = j * hy;
      for (let i = 0; i < nx; i++) {
        const x = (i + 0.5) * hx;
        const k = i + j * nx;
        const ux = this.sampleU(x, y);
        const vy = v[k];
        const mx = x - 0.5 * dt * ux;
        const my = y - 0.5 * dt * vy;
        const sx = x - dt * this.sampleU(mx, my);
        const sy = y - dt * this.sampleV(mx, my);
        v0[k] = this.sampleV(sx, sy);
      }
    }
    for (let i = 0; i < nx; i++) {
      v0[i] = 0;
      v0[i + ny * nx] = 0;
    }

    this.u = u0;
    this.u0 = u;
    this.v = v0;
    this.v0 = v;
  }

  private confineVorticity(dt: number, eps: number) {
    const { nx, ny, hx, hy, u, v, curl, fx, fy } = this;
    const s = nx + 1;
    const uc = (i: number, j: number) => 0.5 * (u[i + j * s] + u[i + 1 + j * s]);
    const vc = (i: number, j: number) => 0.5 * (v[i + j * nx] + v[i + (j + 1) * nx]);

    curl.fill(0);
    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        curl[i + j * nx] =
          (vc(i + 1, j) - vc(i - 1, j)) / (2 * hx) - (uc(i, j + 1) - uc(i, j - 1)) / (2 * hy);
      }
    }

    fx.fill(0);
    fy.fill(0);
    const h = Math.min(hx, hy);
    for (let j = 2; j < ny - 2; j++) {
      for (let i = 2; i < nx - 2; i++) {
        const k = i + j * nx;
        const gx = (Math.abs(curl[k + 1]) - Math.abs(curl[k - 1])) / (2 * hx);
        const gy = (Math.abs(curl[k + nx]) - Math.abs(curl[k - nx])) / (2 * hy);
        const len = Math.hypot(gx, gy) + 1e-5;
        const w = curl[k];
        fx[k] = eps * h * (gy / len) * w;
        fy[k] = -eps * h * (gx / len) * w;
      }
    }

    for (let j = 0; j < ny; j++) {
      for (let i = 1; i < nx; i++) {
        u[i + j * s] += dt * 0.5 * (fx[i - 1 + j * nx] + fx[i + j * nx]);
      }
    }
    for (let j = 1; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        v[i + j * nx] += dt * 0.5 * (fy[i + (j - 1) * nx] + fy[i + j * nx]);
      }
    }
  }

  /** Make the velocity divergence-free (water is incompressible, so ink area is conserved). */
  private project(iterations: number) {
    const { nx, ny, hx, hy, u, v, p, div } = this;
    const s = nx + 1;
    const ax = 1 / (hx * hx);
    const ay = 1 / (hy * hy);

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        div[i + j * nx] =
          (u[i + 1 + j * s] - u[i + j * s]) / hx + (v[i + (j + 1) * nx] - v[i + j * nx]) / hy;
      }
    }

    // Successive over-relaxation (Gauss-Seidel), warm-started from last frame's pressure.
    const omega = 1.82;
    for (let it = 0; it < iterations; it++) {
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const k = i + j * nx;
          let sum = 0;
          let wsum = 0;
          if (i > 0) { sum += ax * p[k - 1]; wsum += ax; }
          if (i < nx - 1) { sum += ax * p[k + 1]; wsum += ax; }
          if (j > 0) { sum += ay * p[k - nx]; wsum += ay; }
          if (j < ny - 1) { sum += ay * p[k + nx]; wsum += ay; }
          const target = (sum - div[k]) / wsum;
          p[k] += omega * (target - p[k]);
        }
      }
    }

    for (let j = 0; j < ny; j++) {
      for (let i = 1; i < nx; i++) {
        u[i + j * s] -= (p[i + j * nx] - p[i - 1 + j * nx]) / hx;
      }
    }
    for (let j = 1; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        v[i + j * nx] -= (p[i + j * nx] - p[i + (j - 1) * nx]) / hy;
      }
    }
  }
}
