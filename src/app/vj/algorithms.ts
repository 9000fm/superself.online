/**
 * Pluggable pattern algorithms for the ASCII art engine.
 *
 * Each algorithm receives normalized grid coordinates (0-1) + time
 * and returns a density value (0-1) that gets mapped to a palette character.
 *
 * The interactive layer (mouse blob, trails, sparkles, scatter) is applied
 * AFTER the algorithm, so all algorithms get mouse reactivity for free.
 */

// ─── Compact simplex noise (2D) ───────────────────────────────
// Based on Stefan Gustavson's implementation, minified for inline use.

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

const GRAD2: [number, number][] = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

// Deterministic permutation table (256 entries, doubled for wrapping)
const PERM = new Uint8Array(512);
const PERM_SEED = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
  140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
  247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
  57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
  74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
  60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
  65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
  200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
  52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
  207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
  119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
  129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
  218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
  81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
  184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
  222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];
for (let i = 0; i < 256; i++) {
  PERM[i] = PERM_SEED[i];
  PERM[i + 256] = PERM_SEED[i];
}

function simplex2(x: number, y: number): number {
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1.0 + 2.0 * G2;
  const y2 = y0 - 1.0 + 2.0 * G2;

  const ii = i & 255;
  const jj = j & 255;

  let n0 = 0, n1 = 0, n2 = 0;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 > 0) {
    t0 *= t0;
    const g = GRAD2[PERM[ii + PERM[jj]] % 8];
    n0 = t0 * t0 * (g[0] * x0 + g[1] * y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 > 0) {
    t1 *= t1;
    const g = GRAD2[PERM[ii + i1 + PERM[jj + j1]] % 8];
    n1 = t1 * t1 * (g[0] * x1 + g[1] * y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 > 0) {
    t2 *= t2;
    const g = GRAD2[PERM[ii + 1 + PERM[jj + 1]] % 8];
    n2 = t2 * t2 * (g[0] * x2 + g[1] * y2);
  }

  return 70.0 * (n0 + n1 + n2); // Returns -1 to 1
}

// Fractal Brownian motion (layered noise)
function fbm(x: number, y: number, octaves: number, lacunarity: number, gain: number): number {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    sum += simplex2(x * freq, y * freq) * amp;
    max += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / max;
}


// ─── Algorithm interface ──────────────────────────────────────

export interface AlgorithmParams {
  nx: number;        // normalized x (0-1)
  ny: number;        // normalized y (0-1)
  time: number;      // elapsed time (seconds * masterSpeed)
  frame: number;     // frame count
  centerFade: number; // pre-computed center fade (0-1)
  width: number;     // grid width
  height: number;    // grid height
}

export type AlgorithmFn = (p: AlgorithmParams) => number;

// ─── ALGORITHM 1: WAVES (the original) ───────────────────────
// Multi-wave sine interference. The classic superself look.
// This is computed inline in AsciiArt.tsx for performance (not extracted here)
// but included for reference. The engine falls back to inline waves when
// algorithm is 'waves'.

// ─── ALGORITHM 2: FLOW ───────────────────────────────────────
// Layered simplex noise creates organic, smoke-like flowing patterns.
// Multiple noise octaves at different scales and speeds.
// Feels like watching currents in deep water from above.

export const flow: AlgorithmFn = ({ nx, ny, time, centerFade }) => {
  const scale = 3.5;
  const speed = time * 0.4;

  // Layer 1: large slow-moving structures
  const n1 = fbm(nx * scale + speed * 0.3, ny * scale + speed * 0.2, 4, 2.0, 0.5);
  // Layer 2: medium detail, different direction
  const n2 = fbm(nx * scale * 1.7 - speed * 0.15, ny * scale * 1.3 + speed * 0.25, 3, 2.2, 0.45);
  // Layer 3: fine detail, fastest
  const n3 = simplex2(nx * scale * 4 + speed * 0.5, ny * scale * 4 - speed * 0.3);

  const combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
  return Math.max(0, Math.min(1, (combined + 1) * 0.5 * centerFade));
};

// ─── ALGORITHM 3: PULSE ──────────────────────────────────────
// Multiple orbiting emitters send out concentric rings.
// Rings interfere where they overlap, creating evolving moiré-like patterns.
// Each emitter has a unique frequency and orbit radius.

export const pulse: AlgorithmFn = ({ nx, ny, time, centerFade, width, height }) => {
  const aspect = width / height;
  const cx = nx * aspect; // aspect-corrected x
  const cy = ny;

  // 4 pulse emitters orbiting at different speeds and radii
  const emitters = [
    { ox: 0.5 * aspect + Math.cos(time * 0.3) * 0.25 * aspect, oy: 0.5 + Math.sin(time * 0.3) * 0.25, freq: 12, phase: 0 },
    { ox: 0.5 * aspect + Math.cos(time * 0.47 + 2.1) * 0.3 * aspect, oy: 0.5 + Math.sin(time * 0.47 + 2.1) * 0.3, freq: 9, phase: 1.5 },
    { ox: 0.5 * aspect + Math.cos(time * 0.23 + 4.2) * 0.2 * aspect, oy: 0.5 + Math.sin(time * 0.23 + 4.2) * 0.2, freq: 15, phase: 3.0 },
    { ox: 0.5 * aspect + Math.cos(time * 0.61 + 0.7) * 0.35 * aspect, oy: 0.5 + Math.sin(time * 0.61 + 0.7) * 0.35, freq: 7, phase: 4.5 },
  ];

  let sum = 0;
  for (const e of emitters) {
    const dx = cx - e.ox;
    const dy = cy - e.oy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Concentric rings that expand outward
    const ring = Math.sin(dist * e.freq - time * 2.5 + e.phase);
    // Attenuate with distance
    const atten = 1 / (1 + dist * 3);
    sum += ring * atten;
  }

  const value = (sum / 4 + 1) * 0.5;
  return Math.max(0, Math.min(1, value * centerFade));
};

// ─── ALGORITHM 4: MEMBRANE ───────────────────────────────────
// Simulates a vibrating 2D surface using the wave equation.
// Self-exciting: random perturbations keep it alive.
// Creates organic ripple interference patterns.
// Note: this uses internal state (buffers), wrapped in a closure.

export function createMembrane(gridW: number, gridH: number): AlgorithmFn {
  // Downsample for performance — membrane sim at 1/3 resolution
  const mw = Math.max(10, Math.floor(gridW / 3));
  const mh = Math.max(8, Math.floor(gridH / 3));
  const size = mw * mh;
  let cur = new Float32Array(size);
  let prev = new Float32Array(size);
  const damping = 0.985;
  let lastStep = 0;
  const stepInterval = 50; // ms between physics steps

  function step(time: number) {
    // Random self-excitation
    if (Math.random() < 0.08) {
      const rx = Math.floor(Math.random() * (mw - 4)) + 2;
      const ry = Math.floor(Math.random() * (mh - 4)) + 2;
      const amp = (Math.random() - 0.5) * 2.0;
      cur[ry * mw + rx] += amp;
    }

    const next = new Float32Array(size);
    for (let y = 1; y < mh - 1; y++) {
      for (let x = 1; x < mw - 1; x++) {
        const i = y * mw + x;
        const neighbors = cur[i - 1] + cur[i + 1] + cur[(y - 1) * mw + x] + cur[(y + 1) * mw + x];
        next[i] = (neighbors / 2 - prev[i]) * damping;
      }
    }
    prev = cur;
    cur = next;
  }

  return ({ nx, ny, time: t, centerFade }) => {
    // Step the simulation forward
    const now = t * 1000;
    while (now - lastStep > stepInterval) {
      step(t);
      lastStep += stepInterval;
    }

    // Sample with bilinear interpolation
    const fx = nx * (mw - 1);
    const fy = ny * (mh - 1);
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const dx = fx - ix;
    const dy = fy - iy;

    const ix1 = Math.min(ix + 1, mw - 1);
    const iy1 = Math.min(iy + 1, mh - 1);

    const v00 = cur[iy * mw + ix];
    const v10 = cur[iy * mw + ix1];
    const v01 = cur[iy1 * mw + ix];
    const v11 = cur[iy1 * mw + ix1];

    const val = v00 * (1 - dx) * (1 - dy) + v10 * dx * (1 - dy) +
                v01 * (1 - dx) * dy + v11 * dx * dy;

    // Map ±1 range to 0-1
    return Math.max(0, Math.min(1, (val * 0.5 + 0.5) * centerFade));
  };
}

// ─── ALGORITHM 5: SIGNAL ─────────────────────────────────────
// Radio-wave interference from multiple transmitters.
// Each transmitter has its own frequency, position drift, and signal strength.
// Creates complex, slowly evolving electromagnetic-looking patterns.

export const signal: AlgorithmFn = ({ nx, ny, time, centerFade, width, height }) => {
  const aspect = width / height;
  const ax = nx * aspect;
  const ay = ny;

  // 5 transmitters with different behaviors
  const transmitters = [
    { x: 0.3 * aspect + Math.sin(time * 0.15) * 0.1 * aspect, y: 0.3 + Math.cos(time * 0.2) * 0.1, freq: 20, power: 1.0 },
    { x: 0.7 * aspect + Math.cos(time * 0.25) * 0.15 * aspect, y: 0.6 + Math.sin(time * 0.18) * 0.12, freq: 14, power: 0.8 },
    { x: 0.5 * aspect + Math.sin(time * 0.12 + 1) * 0.2 * aspect, y: 0.5 + Math.cos(time * 0.12 + 1) * 0.2, freq: 25, power: 0.6 },
    { x: 0.2 * aspect + Math.cos(time * 0.35) * 0.08 * aspect, y: 0.7 + Math.sin(time * 0.3) * 0.08, freq: 18, power: 0.7 },
    { x: 0.8 * aspect + Math.sin(time * 0.2 + 3) * 0.12 * aspect, y: 0.3 + Math.cos(time * 0.22 + 3) * 0.1, freq: 11, power: 0.9 },
  ];

  let sum = 0;
  for (const tx of transmitters) {
    const dx = ax - tx.x;
    const dy = ay - tx.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Signal = sin(distance * frequency - time * speed) / (1 + distance)
    const sig = Math.sin(dist * tx.freq - time * 3) * tx.power / (1 + dist * 5);
    sum += sig;
  }

  return Math.max(0, Math.min(1, (sum * 0.4 + 0.5) * centerFade));
};

// ─── ALGORITHM 6: SPIRAL ─────────────────────────────────────
// Logarithmic spirals emanating from a wandering center.
// Multiple spiral arms that rotate at different speeds.
// Creates a hypnotic, rotating vortex effect.

export const spiral: AlgorithmFn = ({ nx, ny, time, centerFade, width, height }) => {
  const aspect = width / height;
  // Wandering center
  const cx = 0.5 + Math.sin(time * 0.15) * 0.1;
  const cy = 0.5 + Math.cos(time * 0.12) * 0.1;

  const dx = (nx - cx) * aspect;
  const dy = ny - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // 3 spiral arms with different tightness
  const arm1 = Math.sin(angle * 3 + Math.log(dist + 0.01) * 8 - time * 1.2);
  const arm2 = Math.sin(angle * 5 - Math.log(dist + 0.01) * 6 + time * 0.8);
  const arm3 = Math.sin(angle * 2 + Math.log(dist + 0.01) * 10 - time * 0.5);

  // Attenuate from center
  const atten = Math.exp(-dist * 1.5);
  const combined = (arm1 * 0.5 + arm2 * 0.3 + arm3 * 0.2) * atten;

  return Math.max(0, Math.min(1, (combined + 1) * 0.5 * centerFade));
};

// ─── ALGORITHM 7: REACTION ───────────────────────────────────
// Reaction-diffusion (Gray-Scott model) — creates organic living patterns.
// Self-organizing spots, stripes, and coral-like structures that slowly evolve.
// Uses internal state buffers, wrapped in a closure.

export function createReaction(gridW: number, gridH: number): AlgorithmFn {
  const rw = Math.max(10, Math.floor(gridW / 3));
  const rh = Math.max(8, Math.floor(gridH / 3));
  const size = rw * rh;
  const u = new Float32Array(size).fill(1); // chemical U
  const v = new Float32Array(size).fill(0); // chemical V
  let lastStep = 0;
  const stepInterval = 40;

  // Seed: random patches of V
  for (let i = 0; i < 8; i++) {
    const sx = Math.floor(Math.random() * (rw - 6)) + 3;
    const sy = Math.floor(Math.random() * (rh - 6)) + 3;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const idx = (sy + dy) * rw + (sx + dx);
        if (idx >= 0 && idx < size) {
          v[idx] = 0.25 + Math.random() * 0.25;
          u[idx] = 0.5 + Math.random() * 0.25;
        }
      }
    }
  }

  // Gray-Scott parameters (coral-like)
  const Du = 0.16;
  const Dv = 0.08;
  const feed = 0.035;
  const kill = 0.065;
  const dt = 1.0;

  function step() {
    const nu = new Float32Array(u);
    const nv = new Float32Array(v);

    for (let y = 1; y < rh - 1; y++) {
      for (let x = 1; x < rw - 1; x++) {
        const i = y * rw + x;
        // Laplacian (5-point stencil)
        const lapU = u[i - 1] + u[i + 1] + u[(y - 1) * rw + x] + u[(y + 1) * rw + x] - 4 * u[i];
        const lapV = v[i - 1] + v[i + 1] + v[(y - 1) * rw + x] + v[(y + 1) * rw + x] - 4 * v[i];

        const uvv = u[i] * v[i] * v[i];
        nu[i] = u[i] + (Du * lapU - uvv + feed * (1 - u[i])) * dt;
        nv[i] = v[i] + (Dv * lapV + uvv - (kill + feed) * v[i]) * dt;

        nu[i] = Math.max(0, Math.min(1, nu[i]));
        nv[i] = Math.max(0, Math.min(1, nv[i]));
      }
    }

    u.set(nu);
    v.set(nv);

    // Occasional random perturbation to keep it alive
    if (Math.random() < 0.02) {
      const rx = Math.floor(Math.random() * (rw - 4)) + 2;
      const ry = Math.floor(Math.random() * (rh - 4)) + 2;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = (ry + dy) * rw + (rx + dx);
          v[idx] = 0.25;
          u[idx] = 0.5;
        }
      }
    }
  }

  return ({ nx, ny, time: t, centerFade }) => {
    const now = t * 1000;
    // Run multiple steps per frame for faster evolution
    let steps = 0;
    while (now - lastStep > stepInterval && steps < 5) {
      step();
      lastStep += stepInterval;
      steps++;
    }

    // Sample with bilinear interpolation
    const fx = nx * (rw - 1);
    const fy = ny * (rh - 1);
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const dx = fx - ix;
    const dy = fy - iy;
    const ix1 = Math.min(ix + 1, rw - 1);
    const iy1 = Math.min(iy + 1, rh - 1);

    const v00 = v[iy * rw + ix];
    const v10 = v[iy * rw + ix1];
    const v01 = v[iy1 * rw + ix];
    const v11 = v[iy1 * rw + ix1];

    const val = v00 * (1 - dx) * (1 - dy) + v10 * dx * (1 - dy) +
                v01 * (1 - dx) * dy + v11 * dx * dy;

    // V chemical mapped to density (invert so high-V = dense characters)
    return Math.max(0, Math.min(1, val * 3 * centerFade));
  };
}


// ─── Algorithm registry ──────────────────────────────────────

export const ALGORITHM_NAMES = ['waves', 'flow', 'pulse', 'membrane', 'signal', 'spiral', 'reaction'] as const;
export type AlgorithmName = (typeof ALGORITHM_NAMES)[number];

// Static algorithms (no internal state)
const STATIC_ALGORITHMS: Partial<Record<AlgorithmName, AlgorithmFn>> = {
  flow,
  pulse,
  signal,
  spiral,
};

/**
 * Get or create an algorithm function.
 * Stateful algorithms (membrane, reaction) need grid dimensions to initialize.
 * Stateless algorithms are returned directly.
 * 'waves' returns null — the engine uses its inline implementation.
 */
export function getAlgorithm(
  name: AlgorithmName,
  gridW: number,
  gridH: number,
): AlgorithmFn | null {
  if (name === 'waves') return null; // handled inline in AsciiArt
  if (name === 'membrane') return createMembrane(gridW, gridH);
  if (name === 'reaction') return createReaction(gridW, gridH);
  return STATIC_ALGORITHMS[name] || null;
}
