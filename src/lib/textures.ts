import * as THREE from "three";

/**
 * Procedural textures, drawn on a canvas at runtime.
 *
 * There is no asset pipeline here and nothing may be fetched from another
 * host, so every map the building uses is generated in code. This is also
 * what carries the realism: flat-colored boxes read as a diagram, while
 * brick coursing with mortar joints, colour variation per brick and a
 * matching normal map reads as a building.
 *
 * Every generator takes the palette so the architecture sits in the site's
 * own colour world rather than beside it.
 */

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

const css = ({ r, g, b }: Rgb, alpha = 1) =>
  alpha === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;

/** Deterministic pseudo-random, so the building is identical on every load. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const el = document.createElement("canvas");
  el.width = size;
  el.height = size;
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return [el, ctx];
}

function finish(el: HTMLCanvasElement, repeat: number): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(el);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* --------------------------------------------------------------------------
   BRICK
   Running bond, the coursing you actually see on low-rise multifamily.
   -------------------------------------------------------------------------- */
export function brickTexture(base: string, mortar: string) {
  const SIZE = 512;
  const [el, ctx] = canvas(SIZE);
  const rand = seeded(20260806);

  const brick = hexToRgb(base);
  const joint = hexToRgb(mortar);

  ctx.fillStyle = css(joint);
  ctx.fillRect(0, 0, SIZE, SIZE);

  const rows = 16;
  const h = SIZE / rows;
  const w = h * 2.4;
  const gap = Math.max(1.5, h * 0.13);

  for (let row = 0; row < rows; row += 1) {
    // Running bond: alternate courses offset by half a brick.
    const offset = row % 2 === 0 ? 0 : -w / 2;
    for (let x = offset - w; x < SIZE + w; x += w) {
      // Per-brick colour variation is the single biggest realism win here.
      const shade = 0.82 + rand() * 0.36;
      const warm = mix(brick, { r: 255, g: 240, b: 220 }, rand() * 0.14);
      ctx.fillStyle = css({
        r: Math.min(255, Math.round(warm.r * shade)),
        g: Math.min(255, Math.round(warm.g * shade)),
        b: Math.min(255, Math.round(warm.b * shade)),
      });
      ctx.fillRect(x + gap / 2, row * h + gap / 2, w - gap, h - gap);
    }
  }

  // Fine grain over the whole field, so it does not look vector-drawn.
  const grain = ctx.getImageData(0, 0, SIZE, SIZE);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (rand() - 0.5) * 22;
    grain.data[i] = Math.max(0, Math.min(255, grain.data[i]! + n));
    grain.data[i + 1] = Math.max(0, Math.min(255, grain.data[i + 1]! + n));
    grain.data[i + 2] = Math.max(0, Math.min(255, grain.data[i + 2]! + n));
  }
  ctx.putImageData(grain, 0, 0);

  /* Matching normal map. The mortar joints sit back from the brick faces, so
     raking light picks out the coursing. Derived from the same geometry
     rather than from the albedo, which keeps the joints crisp. */
  const [nEl, nCtx] = canvas(SIZE);
  nCtx.fillStyle = "rgb(128,128,255)";
  nCtx.fillRect(0, 0, SIZE, SIZE);
  for (let row = 0; row < rows; row += 1) {
    const offset = row % 2 === 0 ? 0 : -w / 2;
    for (let x = offset - w; x < SIZE + w; x += w) {
      const bx = x + gap / 2;
      const by = row * h + gap / 2;
      const bw = w - gap;
      const bh = h - gap;
      nCtx.fillStyle = "rgb(128,128,255)";
      nCtx.fillRect(bx, by, bw, bh);
      // Light catches the top and left edge, falls away at bottom and right.
      nCtx.fillStyle = "rgb(150,106,235)";
      nCtx.fillRect(bx, by, bw, 2);
      nCtx.fillStyle = "rgb(106,150,235)";
      nCtx.fillRect(bx, by + bh - 2, bw, 2);
    }
  }

  const map = finish(el, 1);
  const normalMap = new THREE.CanvasTexture(nEl);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.anisotropy = 8;

  return { map, normalMap };
}

/* --------------------------------------------------------------------------
   STUCCO / RENDER
   For the gable ends and the cutaway's party walls.
   -------------------------------------------------------------------------- */
export function stuccoTexture(base: string) {
  const SIZE = 256;
  const [el, ctx] = canvas(SIZE);
  const rand = seeded(70147);
  const rgb = hexToRgb(base);

  ctx.fillStyle = css(rgb);
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Troweled stipple: many soft, low-contrast blobs.
  for (let i = 0; i < 4200; i += 1) {
    const x = rand() * SIZE;
    const y = rand() * SIZE;
    const r = rand() * 2.6 + 0.4;
    const light = rand() > 0.5;
    ctx.fillStyle = light
      ? `rgba(255,255,255,${rand() * 0.16})`
      : `rgba(0,0,0,${rand() * 0.14})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return finish(el, 1);
}

/* --------------------------------------------------------------------------
   CONCRETE, for the exposed floor slabs of the cutaway.
   -------------------------------------------------------------------------- */
export function concreteTexture(base: string) {
  const SIZE = 256;
  const [el, ctx] = canvas(SIZE);
  const rand = seeded(31337);
  const rgb = hexToRgb(base);

  ctx.fillStyle = css(rgb);
  ctx.fillRect(0, 0, SIZE, SIZE);

  for (let i = 0; i < 2600; i += 1) {
    ctx.fillStyle = `rgba(${rand() > 0.5 ? "255,255,255" : "0,0,0"},${rand() * 0.1})`;
    ctx.fillRect(rand() * SIZE, rand() * SIZE, rand() * 3, rand() * 3);
  }

  return finish(el, 1);
}

/* --------------------------------------------------------------------------
   UNIT NUMBERS
   One texture holding the whole grid of unit numbers, mapped across the back
   wall of the cutaway. Doing it this way means the numbers cost a single
   draw call instead of one text mesh per unit.
   -------------------------------------------------------------------------- */
export function unitNumberTexture(
  cols: number,
  floors: number,
  wall: string,
  ink: string,
  accent: string,
  litUnits: Set<string>,
) {
  const CELL = 256;
  const el = document.createElement("canvas");
  el.width = CELL * cols;
  el.height = CELL * floors;
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");

  const rand = seeded(9091);
  const wallRgb = hexToRgb(wall);

  for (let floor = 0; floor < floors; floor += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * CELL;
      // Row 0 of the texture is the TOP floor, matching how it is mapped.
      const y = (floors - 1 - floor) * CELL;
      const lit = litUnits.has(`${col}:${floor}`);

      // Interior back wall. Lit units are warmer and brighter.
      const shade = 0.9 + rand() * 0.2;
      const tint = lit
        ? mix(wallRgb, hexToRgb(accent), 0.22)
        : mix(wallRgb, { r: 0, g: 0, b: 0 }, 0.35);
      ctx.fillStyle = css({
        r: Math.round(tint.r * shade),
        g: Math.round(tint.g * shade),
        b: Math.round(tint.b * shade),
      });
      ctx.fillRect(x, y, CELL, CELL);

      // A soft pool of light on the back wall, as if from a window.
      if (lit) {
        const grad = ctx.createRadialGradient(
          x + CELL * 0.5,
          y + CELL * 0.42,
          CELL * 0.05,
          x + CELL * 0.5,
          y + CELL * 0.42,
          CELL * 0.62,
        );
        grad.addColorStop(0, css(hexToRgb(accent), 0.5));
        grad.addColorStop(1, css(hexToRgb(accent), 0));
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, CELL, CELL);
      }

      // The unit number, set the way a door plaque actually reads.
      const number = (floor + 1) * 100 + (col + 1);
      ctx.font = `600 ${CELL * 0.2}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = lit ? css(hexToRgb(ink), 0.92) : css(hexToRgb(ink), 0.5);
      ctx.fillText(String(number), x + CELL / 2, y + CELL / 2);

      // Hairline unit divider, so the grid reads as separate homes.
      ctx.strokeStyle = css(hexToRgb(ink), 0.18);
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
    }
  }

  const texture = new THREE.CanvasTexture(el);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
