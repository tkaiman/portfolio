import React, { useEffect, useRef, useState } from 'react';
import type { FluidMode } from './Landing.tsx';

interface FluidBasinCanvasProps {
  fluidMode: FluidMode;
  viscosity: number;
  dropPulseCount: number;
  swirlPlateSrc: string;
  variant: 'home' | 'masthead';
  onFlowChange?: (flowNormalized: number) => void;
}

interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  attach: (unit: number) => number;
}

interface DoubleFBO {
  width: number;
  height: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}

const BASE_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Converts suminagashi-swirl.png into optical ink absorption over #f2f1ef washi paper
// so uninked paper is 100% transparent (0.0) and all ink veins can be advected freely
// with zero static ghost image behind them.
const INIT_INK_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uPlate;
uniform vec2 uCanvasSize;
uniform vec2 uImgSize;
uniform int uIsMobile;
uniform int uIsMasthead;

const vec3 PAPER_RGB = vec3(0.949, 0.945, 0.937);

void main() {
  vec4 box; // (xMin, yMin, width, height) in WebGL UV space (y=0 bottom, y=1 top)
  float opacityScale = 1.0;

  if (uIsMasthead == 1) {
    float boxW = min(560.0 / max(1.0, uCanvasSize.x), 0.52);
    box = vec4(1.0 - boxW, 0.0, boxW, 1.0);
    opacityScale = 0.44;
  } else if (uIsMobile == 1) {
    float topPx = 48.0;
    float hPx = 360.0;
    float yMax = 1.0 - topPx / max(1.0, uCanvasSize.y);
    float yMin = max(0.0, yMax - hPx / max(1.0, uCanvasSize.y));
    box = vec4(0.34, yMin, 0.78, max(0.05, yMax - yMin));
    opacityScale = 0.42;
  } else {
    // Full-height basin stage on desktop Overview (x: 46.15%..92.30%, y: 0..100%)
    box = vec4(0.4615, 0.0, 0.4615, 1.0);
    opacityScale = 1.0;
  }

  vec2 local = (vUv - box.xy) / box.zw;
  if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) {
    fragColor = vec4(0.0);
    return;
  }

  // Match CSS object-fit: cover; object-position: center top
  float boxPxW = box.z * uCanvasSize.x;
  float boxPxH = box.w * uCanvasSize.y;
  float boxAspect = boxPxW / max(1.0, boxPxH);
  float imgAspect = uImgSize.x / max(1.0, uImgSize.y);

  vec2 imgUv;
  if (boxAspect > imgAspect) {
    float visH = imgAspect / boxAspect;
    imgUv.x = local.x;
    imgUv.y = 1.0 - (1.0 - local.y) * visH;
  } else {
    float visW = boxAspect / imgAspect;
    imgUv.x = 0.5 + (local.x - 0.5) * visW;
    imgUv.y = local.y;
  }

  vec3 tex = texture(uPlate, clamp(imgUv, 0.001, 0.999)).rgb;

  // Feather masks matching DESIGN.md's Feathered Plate Mask Rule
  float mask = 1.0;
  if (uIsMasthead == 1) {
    mask *= smoothstep(0.0, 0.48, local.x);
    mask *= smoothstep(0.0, 0.52, local.y);
  } else if (uIsMobile == 1) {
    mask *= smoothstep(0.04, 0.62, local.x);
    mask *= smoothstep(0.05, 0.66, local.y);
  } else {
    mask *= smoothstep(0.0, 0.11, local.x);
  }

  // Optical absorption relative to #f2f1ef kozo paper, removing tiny paper noise
  vec3 rawAbs = max(vec3(0.0), (PAPER_RGB - tex) / PAPER_RGB);
  vec3 cleanAbs = smoothstep(0.018, 0.96, rawAbs) * 0.94;
  fragColor = vec4(cleanAbs * mask * opacityScale, 1.0);
}
`;

const RESAMPLE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSource;
void main() {
  fragColor = texture(uSource, vUv);
}
`;

// Injects pointer or fan velocity into the Navier-Stokes velocity field
const SPLAT_VEL_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uVelocity;
uniform vec2 uPoint;
uniform vec2 uDeltaVel;
uniform float uRadius;
uniform float uAspect;
uniform vec2 uBasinX;

void main() {
  vec2 base = texture(uVelocity, vUv).xy;
  if (vUv.x < uBasinX.x || vUv.x > uBasinX.y) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  float falloff = exp(-dot(p, p) / max(0.00001, uRadius * uRadius));
  vec2 nextVel = clamp(base + uDeltaVel * falloff, vec2(-8.0), vec2(8.0));
  fragColor = vec4(nextVel, 0.0, 1.0);
}
`;

// Area-preserving Jaffer Suminagashi drop: parts existing ink smoothly outward
// via continuous r_src = sqrt(r^2 - R^2) with a clear surfactant collar and
// a delicate floating sumi droplet inside — never darkening on click.
const DROP_INK_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uInk;
uniform vec2 uCenter;
uniform float uDropRadius;
uniform float uAspect;
uniform float uStrength;
uniform vec2 uBasinX;
uniform float uPhase;

// Living Indigo Current (#1e2d4a) / Deep Sumi (#081730) optical absorption on #f2f1ef
const vec3 SUMI_ABS = vec3(0.84, 0.77, 0.65);

void main() {
  if (vUv.x < uBasinX.x || vUv.x > uBasinX.y) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 delta = vUv - uCenter;
  vec2 metric = vec2(delta.x * uAspect, delta.y);
  float angle = atan(metric.y, metric.x);
  // Subtle organic surface-tension contour applied consistently to R
  float contour = 1.0 + 0.035 * sin(angle * 2.0 + uPhase) + 0.02 * cos(angle * 3.0 - uPhase * 0.7);
  float R = uDropRadius * contour;
  float r = length(metric);

  // Continuous Jaffer displacement: as r -> R+, rSrc -> 0 smoothly with zero jump
  float rSrc = sqrt(max(0.0, r * r - R * R));
  vec2 dir = metric / max(0.00001, r);
  vec2 srcMetric = dir * rSrc;
  vec2 srcUv = uCenter + vec2(srcMetric.x / uAspect, srcMetric.y);
  srcUv.x = clamp(srcUv.x, uBasinX.x + 0.001, uBasinX.y - 0.001);
  srcUv.y = clamp(srcUv.y, 0.001, 0.999);
  vec3 displacedInk = texture(uInk, srcUv).rgb;

  // Delicate inner sumi ring + soft core surrounded by a wide clear surfactant collar (0.54..1.0)
  float t = r / max(0.0001, R);
  float innerRim = exp(-pow((t - 0.46) / 0.095, 2.0)) * 0.76;
  float innerWash = smoothstep(0.46, 0.08, t) * 0.34;
  vec3 newDrop = SUMI_ABS * (innerRim + innerWash) * uStrength;

  // Smooth 2-texel transition across the surfactant front r == R
  float outsideBlend = smoothstep(R - 0.0022, R + 0.0022, r);
  vec3 result = mix(newDrop, displacedInk, outsideBlend);
  fragColor = vec4(clamp(result, 0.0, 0.92), 1.0);
}
`;

const CURL_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uVelocity;
uniform vec2 uTexelSize;

void main() {
  float L = texture(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).y;
  float R = texture(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).y;
  float T = texture(uVelocity, vUv + vec2(0.0, uTexelSize.y)).x;
  float B = texture(uVelocity, vUv - vec2(0.0, uTexelSize.y)).x;
  float vorticity = 0.5 * ((R - L) - (T - B));
  fragColor = vec4(vorticity, 0.0, 0.0, 1.0);
}
`;

const VORTICITY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexelSize;
uniform float uCurlStrength;
uniform float uDt;

void main() {
  float L = abs(texture(uCurl, vUv - vec2(uTexelSize.x, 0.0)).x);
  float R = abs(texture(uCurl, vUv + vec2(uTexelSize.x, 0.0)).x);
  float T = abs(texture(uCurl, vUv + vec2(0.0, uTexelSize.y)).x);
  float B = abs(texture(uCurl, vUv - vec2(0.0, uTexelSize.y)).x);
  float C = texture(uCurl, vUv).x;

  vec2 force = 0.5 * vec2(T - B, L - R);
  force /= length(force) + 0.0001;
  force *= uCurlStrength * C;

  vec2 vel = texture(uVelocity, vUv).xy;
  vel = clamp(vel + force * uDt, vec2(-8.0), vec2(8.0));
  fragColor = vec4(vel, 0.0, 1.0);
}
`;

const DIVERGENCE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uVelocity;
uniform vec2 uTexelSize;
uniform vec2 uBasinX;

vec2 sampleVel(vec2 uv) {
  vec2 v = texture(uVelocity, clamp(uv, 0.0, 1.0)).xy;
  if (uv.x < uBasinX.x || uv.x > uBasinX.y) v.x = 0.0;
  if (uv.y <= 0.0 || uv.y >= 1.0) v.y = 0.0;
  return v;
}

void main() {
  float L = sampleVel(vUv - vec2(uTexelSize.x, 0.0)).x;
  float R = sampleVel(vUv + vec2(uTexelSize.x, 0.0)).x;
  float T = sampleVel(vUv + vec2(0.0, uTexelSize.y)).y;
  float B = sampleVel(vUv - vec2(0.0, uTexelSize.y)).y;
  float div = 0.5 * (R - L + T - B);
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

const CLEAR_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform float uValue;
void main() {
  fragColor = uValue * texture(uTexture, vUv);
}
`;

const PRESSURE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexelSize;
uniform vec2 uBasinX;

float sampleP(vec2 uv, float centerP) {
  if (uv.x < uBasinX.x || uv.x > uBasinX.y || uv.y < 0.0 || uv.y > 1.0) {
    return centerP;
  }
  return texture(uPressure, uv).x;
}

void main() {
  float C = texture(uPressure, vUv).x;
  float L = sampleP(vUv - vec2(uTexelSize.x, 0.0), C);
  float R = sampleP(vUv + vec2(uTexelSize.x, 0.0), C);
  float T = sampleP(vUv + vec2(0.0, uTexelSize.y), C);
  float B = sampleP(vUv - vec2(0.0, uTexelSize.y), C);
  float div = texture(uDivergence, vUv).x;
  float p = (L + R + B + T - div) * 0.25;
  fragColor = vec4(p, 0.0, 0.0, 1.0);
}
`;

const GRADIENT_SUB_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexelSize;
uniform vec2 uBasinX;

void main() {
  if (vUv.x < uBasinX.x || vUv.x > uBasinX.y) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float C = texture(uPressure, vUv).x;
  float L = (vUv.x - uTexelSize.x < uBasinX.x) ? C : texture(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
  float R = (vUv.x + uTexelSize.x > uBasinX.y) ? C : texture(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
  float T = (vUv.y + uTexelSize.y > 1.0) ? C : texture(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
  float B = (vUv.y - uTexelSize.y < 0.0) ? C : texture(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;

  vec2 vel = texture(uVelocity, vUv).xy;
  vel -= 0.5 * vec2(R - L, T - B);
  fragColor = vec4(vel, 0.0, 1.0);
}
`;

const ADVECT_VEL_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uVelocity;
uniform float uDt;
uniform float uDissipation;
uniform float uAspect;
uniform vec2 uBasinX;

void main() {
  if (vUv.x < uBasinX.x || vUv.x > uBasinX.y) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 vel = texture(uVelocity, vUv).xy;
  vec2 stepUv = vec2(vel.x / uAspect, vel.y) * uDt;
  vec2 backUv = vUv - stepUv;
  backUv.x = clamp(backUv.x, uBasinX.x + 0.001, uBasinX.y - 0.001);
  backUv.y = clamp(backUv.y, 0.001, 0.999);
  vec2 nextVel = texture(uVelocity, backUv).xy * uDissipation;
  fragColor = vec4(nextVel, 0.0, 1.0);
}
`;

// Second-order MacCormack (BFECC) clamped advection keeps fine Suminagashi veins crisp
// across dozens of drags without blurring or darkening.
const ADVECT_INK_BFECC_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uVelocity;
uniform sampler2D uInk;
uniform vec2 uInkTexel;
uniform float uDt;
uniform float uAspect;
uniform vec2 uBasinX;

vec2 clampBasin(vec2 uv) {
  return vec2(
    clamp(uv.x, uBasinX.x + 0.0005, uBasinX.y - 0.0005),
    clamp(uv.y, 0.0005, 0.9995)
  );
}

void main() {
  if (vUv.x < uBasinX.x || vUv.x > uBasinX.y) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 v0 = texture(uVelocity, vUv).xy;
  float speed = length(v0);
  if (speed < 0.0004) {
    fragColor = texture(uInk, vUv);
    return;
  }

  vec2 d0 = vec2(v0.x / uAspect, v0.y) * uDt;
  vec2 pBack = clampBasin(vUv - d0);

  vec2 v1 = texture(uVelocity, pBack).xy;
  vec2 d1 = vec2(v1.x / uAspect, v1.y) * uDt;
  vec2 pFwd = clampBasin(pBack + d1);

  vec2 pCorr = clampBasin(pBack + 0.5 * (vUv - pFwd));

  // Local neighborhood extrema clamp prevents ringing and strictly bounds pigment [0, 0.95]
  vec2 base = (floor(pBack / uInkTexel - 0.5) + 0.5) * uInkTexel;
  vec3 s00 = texture(uInk, clampBasin(base)).rgb;
  vec3 s10 = texture(uInk, clampBasin(base + vec2(uInkTexel.x, 0.0))).rgb;
  vec3 s01 = texture(uInk, clampBasin(base + vec2(0.0, uInkTexel.y))).rgb;
  vec3 s11 = texture(uInk, clampBasin(base + uInkTexel)).rgb;

  vec3 minC = min(min(s00, s10), min(s01, s11));
  vec3 maxC = max(max(s00, s10), max(s01, s11));

  vec3 advected = clamp(texture(uInk, pCorr).rgb, minC, maxC);
  fragColor = vec4(clamp(advected, 0.0, 0.95), 1.0);
}
`;

// Exact premultiplied Porter-Duff reconstruction over #f2f1ef kozo paper:
// uninked water outputs vec4(0.0) (100% transparent), inked veins output exact pigment color,
// with a soft mist-slate ceiling behind the hero copy zone so dragged ink never impairs legibility.
const DISPLAY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uInk;
uniform vec2 uBasinX;
uniform int uProtectCopy;

const vec3 PAPER_RGB = vec3(0.949, 0.945, 0.937);

void main() {
  if (vUv.x < uBasinX.x || vUv.x > uBasinX.y) {
    fragColor = vec4(0.0);
    return;
  }

  vec3 absRGB = clamp(texture(uInk, vUv).rgb, 0.0, 0.95);
  if (uProtectCopy == 1) {
    float copyX = 1.0 - smoothstep(0.35, 0.50, vUv.x);
    float copyY = smoothstep(0.36, 0.50, vUv.y);
    float copyMask = copyX * copyY;
    absRGB *= mix(1.0, 0.34, copyMask);
  }

  float a = clamp(max(absRGB.r, max(absRGB.g, absRGB.b)) * 1.03, 0.0, 1.0);
  if (a < 0.002) {
    fragColor = vec4(0.0);
    return;
  }

  vec3 premulRGB = clamp(PAPER_RGB * max(vec3(0.0), vec3(a) - absRGB), vec3(0.0), vec3(a));
  fragColor = vec4(premulRGB, a);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, fragSource: string): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, BASE_VERT);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

function createFBO(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number
): FBO | null {
  const texture = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!texture || !fbo) return null;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return null;
  }
  gl.viewport(0, 0, w, h);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {
    texture,
    fbo,
    width: w,
    height: h,
    attach(unit: number) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return unit;
    },
  };
}

function createDoubleFBO(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number
): DoubleFBO | null {
  const fbo1 = createFBO(gl, w, h, internalFormat, format, type, filter);
  const fbo2 = createFBO(gl, w, h, internalFormat, format, type, filter);
  if (!fbo1 || !fbo2) return null;
  return {
    width: w,
    height: h,
    read: fbo1,
    write: fbo2,
    swap() {
      const tmp = this.read;
      this.read = this.write;
      this.write = tmp;
    },
  };
}

const FluidBasinCanvas: React.FC<FluidBasinCanvasProps> = ({
  fluidMode,
  viscosity,
  dropPulseCount,
  swirlPlateSrc,
  variant,
  onFlowChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef<FluidMode>(fluidMode);
  const viscRef = useRef<number>(viscosity);
  const flowRef = useRef<number>(fluidMode === 'still' ? 0.06 : 0.31);
  const dropQueueRef = useRef<{ u: number; v: number; radius: number }[]>([]);
  const [useStaticFallback, setUseStaticFallback] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  modeRef.current = fluidMode;
  viscRef.current = viscosity;

  const lastDropPulseRef = useRef<number>(dropPulseCount);

  // Queue an authentic Suminagashi drop only when the left-rail DROP button is newly clicked
  useEffect(() => {
    if (dropPulseCount <= lastDropPulseRef.current) {
      lastDropPulseRef.current = dropPulseCount;
      return;
    }
    lastDropPulseRef.current = dropPulseCount;
    const u = variant === 'masthead' ? 0.78 + (Math.random() - 0.5) * 0.14 : 0.63 + (Math.random() - 0.5) * 0.2;
    const v = 0.46 + (Math.random() - 0.5) * 0.24;
    dropQueueRef.current.push({ u, v, radius: 0.044 });
    flowRef.current = Math.min(0.95, flowRef.current + 0.34);
  }, [dropPulseCount, variant]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setUseStaticFallback(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      setUseStaticFallback(true);
      return;
    }

    const extFloat = gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('OES_texture_float_linear');
    if (!extFloat) {
      setUseStaticFallback(true);
      return;
    }

    const pInitInk = createProgram(gl, INIT_INK_FRAG);
    const pResample = createProgram(gl, RESAMPLE_FRAG);
    const pSplatVel = createProgram(gl, SPLAT_VEL_FRAG);
    const pDropInk = createProgram(gl, DROP_INK_FRAG);
    const pCurl = createProgram(gl, CURL_FRAG);
    const pVorticity = createProgram(gl, VORTICITY_FRAG);
    const pDivergence = createProgram(gl, DIVERGENCE_FRAG);
    const pClear = createProgram(gl, CLEAR_FRAG);
    const pPressure = createProgram(gl, PRESSURE_FRAG);
    const pGradSub = createProgram(gl, GRADIENT_SUB_FRAG);
    const pAdvectVel = createProgram(gl, ADVECT_VEL_FRAG);
    const pAdvectInk = createProgram(gl, ADVECT_INK_BFECC_FRAG);
    const pDisplay = createProgram(gl, DISPLAY_FRAG);

    if (
      !pInitInk ||
      !pResample ||
      !pSplatVel ||
      !pDropInk ||
      !pCurl ||
      !pVorticity ||
      !pDivergence ||
      !pClear ||
      !pPressure ||
      !pGradSub ||
      !pAdvectVel ||
      !pAdvectInk ||
      !pDisplay
    ) {
      setUseStaticFallback(true);
      return;
    }

    // Fullscreen quad VAO
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const blit = (target: FBO | null) => {
      if (target) {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      } else {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const getBasinBounds = (): [number, number] => {
      const w = parent.clientWidth;
      if (variant === 'masthead' || w <= 960) return [0.0, 1.0];
      return [0.1047, 0.923];
    };

    let simVel: DoubleFBO | null = null;
    let simPressure: DoubleFBO | null = null;
    let simDiv: FBO | null = null;
    let simCurl: FBO | null = null;
    let simInk: DoubleFBO | null = null;
    let plateTex: WebGLTexture | null = null;
    let plateImgSize: [number, number] = [1270, 1344];
    let plateLoaded = false;
    let lastIsMobile = parent.clientWidth <= 960;

    const initInkFromPlate = () => {
      if (!plateLoaded || !plateTex || !simInk) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      gl.useProgram(pInitInk);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, plateTex);
      gl.uniform1i(gl.getUniformLocation(pInitInk, 'uPlate'), 0);
      gl.uniform2f(gl.getUniformLocation(pInitInk, 'uCanvasSize'), w, h);
      gl.uniform2f(gl.getUniformLocation(pInitInk, 'uImgSize'), plateImgSize[0], plateImgSize[1]);
      gl.uniform1i(gl.getUniformLocation(pInitInk, 'uIsMobile'), w <= 960 ? 1 : 0);
      gl.uniform1i(gl.getUniformLocation(pInitInk, 'uIsMasthead'), variant === 'masthead' ? 1 : 0);
      blit(simInk.write);
      simInk.swap();
    };

    const allocateBuffers = (preserveInk: boolean) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(1, parent.clientWidth);
      const cssH = Math.max(1, parent.clientHeight);
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));

      const aspect = cssW / Math.max(1, cssH);
      const velH = 256;
      const velW = Math.max(128, Math.round(velH * aspect));

      const maxInkDim = 2560;
      const inkScale = Math.min(1, maxInkDim / Math.max(canvas.width, canvas.height));
      const inkW = Math.max(64, Math.round(canvas.width * inkScale));
      const inkH = Math.max(64, Math.round(canvas.height * inkScale));

      if (!simVel || simVel.width !== velW || simVel.height !== velH) {
        simVel = createDoubleFBO(gl, velW, velH, gl.RG16F, gl.RG, gl.HALF_FLOAT, gl.LINEAR);
        simPressure = createDoubleFBO(gl, velW, velH, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
        simDiv = createFBO(gl, velW, velH, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
        simCurl = createFBO(gl, velW, velH, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
      }

      const isMobileNow = cssW <= 960;
      const crossedBreakpoint = isMobileNow !== lastIsMobile;
      lastIsMobile = isMobileNow;

      if (!simInk || simInk.width !== inkW || simInk.height !== inkH) {
        const nextInk = createDoubleFBO(
          gl,
          inkW,
          inkH,
          gl.RGBA16F,
          gl.RGBA,
          gl.HALF_FLOAT,
          gl.LINEAR
        );
        if (nextInk) {
          if (preserveInk && simInk && !crossedBreakpoint && plateLoaded) {
            gl.useProgram(pResample);
            gl.uniform1i(gl.getUniformLocation(pResample, 'uSource'), simInk.read.attach(0));
            blit(nextInk.write);
            nextInk.swap();
          } else {
            simInk = nextInk;
            initInkFromPlate();
            return;
          }
          simInk = nextInk;
        }
      } else if (crossedBreakpoint) {
        initInkFromPlate();
      }
    };

    allocateBuffers(false);

    // Load the suminagashi plate directly into WebGL
    let disposed = false;
    const img = new Image();
    img.decoding = 'async';
    img.src = swirlPlateSrc;
    img.onload = () => {
      if (disposed) return;
      plateImgSize = [img.naturalWidth || 1270, img.naturalHeight || 1344];
      plateTex = gl.createTexture();
      if (!plateTex) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, plateTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      plateLoaded = true;
      initInkFromPlate();
      renderDisplay();
    };

    const splatVelocity = (u: number, v: number, du: number, dv: number, radius: number) => {
      if (!simVel) return;
      const [bx0, bx1] = getBasinBounds();
      if (u < bx0 || u > bx1) return;
      const aspect = parent.clientWidth / Math.max(1, parent.clientHeight);
      gl.useProgram(pSplatVel);
      gl.uniform1i(gl.getUniformLocation(pSplatVel, 'uVelocity'), simVel.read.attach(0));
      gl.uniform2f(gl.getUniformLocation(pSplatVel, 'uPoint'), u, v);
      gl.uniform2f(gl.getUniformLocation(pSplatVel, 'uDeltaVel'), du, dv);
      gl.uniform1f(gl.getUniformLocation(pSplatVel, 'uRadius'), radius);
      gl.uniform1f(gl.getUniformLocation(pSplatVel, 'uAspect'), aspect);
      gl.uniform2f(gl.getUniformLocation(pSplatVel, 'uBasinX'), bx0, bx1);
      blit(simVel.write);
      simVel.swap();
    };

    let dropPhase = 0.4;

    const applyInkDrop = (u: number, v: number, radius: number) => {
      if (!simInk || !plateLoaded) return;
      const [bx0, bx1] = getBasinBounds();
      if (u < bx0 || u > bx1) return;
      const aspect = parent.clientWidth / Math.max(1, parent.clientHeight);
      const strength = variant === 'masthead' || parent.clientWidth <= 960 ? 0.46 : 0.78;
      dropPhase += 1.37;

      gl.useProgram(pDropInk);
      gl.uniform1i(gl.getUniformLocation(pDropInk, 'uInk'), simInk.read.attach(0));
      gl.uniform2f(gl.getUniformLocation(pDropInk, 'uCenter'), u, v);
      gl.uniform1f(gl.getUniformLocation(pDropInk, 'uDropRadius'), radius);
      gl.uniform1f(gl.getUniformLocation(pDropInk, 'uAspect'), aspect);
      gl.uniform1f(gl.getUniformLocation(pDropInk, 'uStrength'), strength);
      gl.uniform2f(gl.getUniformLocation(pDropInk, 'uBasinX'), bx0, bx1);
      gl.uniform1f(gl.getUniformLocation(pDropInk, 'uPhase'), dropPhase);
      blit(simInk.write);
      simInk.swap();

      // Gentle radial surface-tension ripple in the velocity field so the drop breathes organically
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2 + dropPhase * 0.25;
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        const ringU = u + (c * radius * 0.85) / Math.max(0.2, aspect);
        const ringV = v + s * radius * 0.85;
        splatVelocity(ringU, ringV, c * 0.28 - s * 0.08, s * 0.28 + c * 0.08, radius * 0.55);
      }
    };

    const renderDisplay = () => {
      if (!simInk) return;
      const [bx0, bx1] = getBasinBounds();
      const protectCopy = variant === 'home' && parent.clientWidth > 960 ? 1 : 0;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(pDisplay);
      gl.uniform1i(gl.getUniformLocation(pDisplay, 'uInk'), simInk.read.attach(0));
      gl.uniform2f(gl.getUniformLocation(pDisplay, 'uBasinX'), bx0, bx1);
      gl.uniform1i(gl.getUniformLocation(pDisplay, 'uProtectCopy'), protectCopy);
      blit(null);
      gl.disable(gl.BLEND);
    };

    // Pointer interaction state: distinguishes clean clicks from stylus drags
    const ptr = {
      isDown: false,
      pointerId: -1,
      hasPrev: false,
      prevX: 0,
      prevY: 0,
      downX: 0,
      downY: 0,
      movedDist: 0,
    };

    const isInteractiveControl = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      return Boolean(el && el.closest('a, button, input, label, select, textarea'));
    };

    const injectStroke = (x0: number, y0: number, x1: number, y1: number, dragging: boolean) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const [bx0, bx1] = getBasinBounds();

      const dxPx = x1 - x0;
      const dyPx = y1 - y0;
      const distPx = Math.hypot(dxPx, dyPx);
      if (distPx < 0.4) return;

      const fluidity = 1.15 - Math.min(0.75, viscRef.current * 1.65);
      const gain = (dragging ? 44.0 : 5.5) * fluidity;
      const radius = dragging ? 0.025 : 0.015;

      const steps = Math.min(20, Math.max(1, Math.ceil(distPx / 5)));
      // Isotropic physical units (1.0 = container height) matching square simVel texels
      const subDu = ((dxPx / rect.height) * gain) / steps;
      const subDv = ((-(dyPx / rect.height) * gain)) / steps;

      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const sx = x0 + dxPx * t;
        const sy = y0 + dyPx * t;
        const u = sx / rect.width;
        const v = 1.0 - sy / rect.height;
        if (u >= bx0 && u <= bx1 && v >= 0 && v <= 1) {
          splatVelocity(u, v, subDu, subDv, radius);
        }
      }

      flowRef.current = Math.min(
        0.96,
        flowRef.current + distPx * (dragging ? 0.0065 : 0.0022)
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (isInteractiveControl(e.target)) return;

      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      const u = nx / Math.max(1, rect.width);
      const [bx0, bx1] = getBasinBounds();
      if (u < bx0 || u > bx1 || ny < 0 || ny > rect.height) return;

      if (e.pointerType === 'mouse') {
        e.preventDefault();
        window.getSelection()?.removeAllRanges();
      }

      ptr.isDown = true;
      ptr.pointerId = e.pointerId;
      ptr.downX = nx;
      ptr.downY = ny;
      ptr.prevX = nx;
      ptr.prevY = ny;
      ptr.hasPrev = true;
      ptr.movedDist = 0;
      parent.classList.add('is-dragging-fluid');
    };

    const onWindowPointerMove = (e: PointerEvent) => {
      if (modeRef.current === 'still') return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;

      if (ptr.isDown && e.pointerId === ptr.pointerId) {
        const stepDist = Math.hypot(nx - ptr.prevX, ny - ptr.prevY);
        ptr.movedDist += stepDist;
        injectStroke(ptr.prevX, ptr.prevY, nx, ny, true);
        ptr.prevX = nx;
        ptr.prevY = ny;
        return;
      }

      // Gentle hover wake when gliding across the basin
      const [bx0, bx1] = getBasinBounds();
      const u = nx / rect.width;
      if (ny < 0 || ny > rect.height || u < bx0 || u > bx1) {
        ptr.hasPrev = false;
        return;
      }
      if (ptr.hasPrev) {
        injectStroke(ptr.prevX, ptr.prevY, nx, ny, false);
      }
      ptr.prevX = nx;
      ptr.prevY = ny;
      ptr.hasPrev = true;
    };

    const endPointer = (e: PointerEvent, allowDropClick: boolean) => {
      if (!ptr.isDown || e.pointerId !== ptr.pointerId) return;
      ptr.isDown = false;
      parent.classList.remove('is-dragging-fluid');

      if (allowDropClick && ptr.movedDist <= 6 && modeRef.current === 'drop') {
        const rect = canvas.getBoundingClientRect();
        const u = (e.clientX - rect.left) / Math.max(1, rect.width);
        const v = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height);
        const [bx0, bx1] = getBasinBounds();
        if (u >= bx0 && u <= bx1 && v >= 0 && v <= 1) {
          dropQueueRef.current.push({ u, v, radius: 0.036 });
          flowRef.current = Math.min(0.95, flowRef.current + 0.28);
        }
      }
    };

    const onWindowPointerUp = (e: PointerEvent) => endPointer(e, true);
    const onWindowPointerCancel = (e: PointerEvent) => endPointer(e, false);

    parent.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', onWindowPointerUp, { passive: true });
    window.addEventListener('pointercancel', onWindowPointerCancel, { passive: true });

    const ro = new ResizeObserver(() => {
      allocateBuffers(true);
      renderDisplay();
    });
    ro.observe(parent);

    // Pause simulation loop when offscreen or tab is hidden (per animate.md)
    let inViewport = true;
    let tabVisible = !document.hidden;
    let rafId = 0;
    let lastFrameTime = performance.now();
    let lastFlowReport = 0;

    const stepSimulation = (now: number) => {
      rafId = 0;
      if (disposed || !inViewport || !tabVisible) return;

      const dt = Math.min(0.032, Math.max(0.004, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      if (simVel && simPressure && simDiv && simCurl && simInk && plateLoaded) {
        const mode = modeRef.current;
        const visc = viscRef.current;
        const [bx0, bx1] = getBasinBounds();
        const aspect = parent.clientWidth / Math.max(1, parent.clientHeight);
        const velTexelX = 1.0 / simVel.width;
        const velTexelY = 1.0 / simVel.height;

        // Drain queued Suminagashi radial drops
        while (dropQueueRef.current.length > 0) {
          const drop = dropQueueRef.current.shift()!;
          applyInkDrop(drop.u, drop.v, drop.radius);
        }

        // Laminar breeze in FAN mode
        if (mode === 'fan') {
          const t = now * 0.001;
          const gust = Math.max(0.18, 0.58 - visc * 0.95);
          const fanU = bx0 + (bx1 - bx0) * (0.48 + 0.16 * Math.sin(t * 0.7));
          const fanV = 0.5 + 0.24 * Math.cos(t * 0.55);
          splatVelocity(
            fanU,
            fanV,
            Math.cos(t * 0.45) * gust * 0.16,
            Math.sin(t * 0.6) * gust * 0.12,
            0.14
          );
          flowRef.current = 0.62 + 0.08 * Math.sin(now * 0.0025);
        } else if (mode === 'still') {
          flowRef.current *= 0.88;
        } else {
          const damp = Math.max(0.92, 0.988 - visc * 0.11);
          flowRef.current = Math.max(0.31, flowRef.current * damp);
        }

        if (onFlowChange && now - lastFlowReport > 90) {
          onFlowChange(flowRef.current);
          lastFlowReport = now;
        }

        if (mode === 'still') {
          // Rapidly settle fluid velocity to calm stillness
          gl.useProgram(pClear);
          gl.uniform1i(gl.getUniformLocation(pClear, 'uTexture'), simVel.read.attach(0));
          gl.uniform1f(gl.getUniformLocation(pClear, 'uValue'), 0.78);
          blit(simVel.write);
          simVel.swap();
        } else {
          // 1. Curl & Vorticity Confinement (creates classic Suminagashi spiral eddies)
          gl.useProgram(pCurl);
          gl.uniform1i(gl.getUniformLocation(pCurl, 'uVelocity'), simVel.read.attach(0));
          gl.uniform2f(gl.getUniformLocation(pCurl, 'uTexelSize'), velTexelX, velTexelY);
          blit(simCurl);

          const curlStrength = Math.max(4.0, 22.0 - visc * 42.0);
          gl.useProgram(pVorticity);
          gl.uniform1i(gl.getUniformLocation(pVorticity, 'uVelocity'), simVel.read.attach(0));
          gl.uniform1i(gl.getUniformLocation(pVorticity, 'uCurl'), simCurl.attach(1));
          gl.uniform2f(gl.getUniformLocation(pVorticity, 'uTexelSize'), velTexelX, velTexelY);
          gl.uniform1f(gl.getUniformLocation(pVorticity, 'uCurlStrength'), curlStrength);
          gl.uniform1f(gl.getUniformLocation(pVorticity, 'uDt'), dt);
          blit(simVel.write);
          simVel.swap();

          // 2. Divergence
          gl.useProgram(pDivergence);
          gl.uniform1i(gl.getUniformLocation(pDivergence, 'uVelocity'), simVel.read.attach(0));
          gl.uniform2f(gl.getUniformLocation(pDivergence, 'uTexelSize'), velTexelX, velTexelY);
          gl.uniform2f(gl.getUniformLocation(pDivergence, 'uBasinX'), bx0, bx1);
          blit(simDiv);

          // 3. Relax Pressure & Run 20 Jacobi Projection Iterations (incompressible water)
          gl.useProgram(pClear);
          gl.uniform1i(gl.getUniformLocation(pClear, 'uTexture'), simPressure.read.attach(0));
          gl.uniform1f(gl.getUniformLocation(pClear, 'uValue'), 0.8);
          blit(simPressure.write);
          simPressure.swap();

          gl.useProgram(pPressure);
          gl.uniform1i(gl.getUniformLocation(pPressure, 'uDivergence'), simDiv.attach(1));
          gl.uniform2f(gl.getUniformLocation(pPressure, 'uTexelSize'), velTexelX, velTexelY);
          gl.uniform2f(gl.getUniformLocation(pPressure, 'uBasinX'), bx0, bx1);
          for (let i = 0; i < 20; i++) {
            gl.uniform1i(gl.getUniformLocation(pPressure, 'uPressure'), simPressure.read.attach(0));
            blit(simPressure.write);
            simPressure.swap();
          }

          // 4. Subtract Pressure Gradient
          gl.useProgram(pGradSub);
          gl.uniform1i(gl.getUniformLocation(pGradSub, 'uPressure'), simPressure.read.attach(0));
          gl.uniform1i(gl.getUniformLocation(pGradSub, 'uVelocity'), simVel.read.attach(1));
          gl.uniform2f(gl.getUniformLocation(pGradSub, 'uTexelSize'), velTexelX, velTexelY);
          gl.uniform2f(gl.getUniformLocation(pGradSub, 'uBasinX'), bx0, bx1);
          blit(simVel.write);
          simVel.swap();

          // 5. Advect Velocity with Viscosity-Coupled Dissipation
          const velDissipation = Math.max(0.84, 0.992 - visc * 0.34);
          gl.useProgram(pAdvectVel);
          gl.uniform1i(gl.getUniformLocation(pAdvectVel, 'uVelocity'), simVel.read.attach(0));
          gl.uniform1f(gl.getUniformLocation(pAdvectVel, 'uDt'), dt);
          gl.uniform1f(gl.getUniformLocation(pAdvectVel, 'uDissipation'), velDissipation);
          gl.uniform1f(gl.getUniformLocation(pAdvectVel, 'uAspect'), aspect);
          gl.uniform2f(gl.getUniformLocation(pAdvectVel, 'uBasinX'), bx0, bx1);
          blit(simVel.write);
          simVel.swap();

          // 6. Advect Suminagashi Ink Pigment via Clamped MacCormack (BFECC)
          gl.useProgram(pAdvectInk);
          gl.uniform1i(gl.getUniformLocation(pAdvectInk, 'uVelocity'), simVel.read.attach(0));
          gl.uniform1i(gl.getUniformLocation(pAdvectInk, 'uInk'), simInk.read.attach(1));
          gl.uniform2f(
            gl.getUniformLocation(pAdvectInk, 'uInkTexel'),
            1.0 / simInk.width,
            1.0 / simInk.height
          );
          gl.uniform1f(gl.getUniformLocation(pAdvectInk, 'uDt'), dt);
          gl.uniform1f(gl.getUniformLocation(pAdvectInk, 'uAspect'), aspect);
          gl.uniform2f(gl.getUniformLocation(pAdvectInk, 'uBasinX'), bx0, bx1);
          blit(simInk.write);
          simInk.swap();
        }

        renderDisplay();
      }

      rafId = requestAnimationFrame(stepSimulation);
    };

    const ensureLoopRunning = () => {
      if (!rafId && !disposed && inViewport && tabVisible) {
        lastFrameTime = performance.now();
        rafId = requestAnimationFrame(stepSimulation);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        inViewport = entries.some((entry) => entry.isIntersecting);
        if (inViewport) ensureLoopRunning();
      },
      { threshold: 0.01 }
    );
    io.observe(parent);

    const onVisibilityChange = () => {
      tabVisible = !document.hidden;
      if (tabVisible) ensureLoopRunning();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    ensureLoopRunning();

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      parent.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerCancel);
      parent.classList.remove('is-dragging-fluid');
      if (plateTex) gl.deleteTexture(plateTex);
      if (vao) gl.deleteVertexArray(vao);
      if (vbo) gl.deleteBuffer(vbo);
    };
  }, [swirlPlateSrc, variant, onFlowChange]);

  if (useStaticFallback) {
    return (
      <figure
        className={variant === 'masthead' ? 'reviews-backdrop-plate' : 'plate-suminagashi'}
        aria-hidden="true"
      >
        <img src={swirlPlateSrc} alt="" draggable={false} />
      </figure>
    );
  }

  return <canvas ref={canvasRef} className="suminagashi-live-canvas" aria-hidden="true" />;
};

export default FluidBasinCanvas;
