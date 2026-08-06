import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildStack, type StackLayout } from "../lib/stack-layout";
import { tiering, motion } from "../content/theme";

/* ==========================================================================
   THE OCCUPANCY STACK

   A tall ordered lattice of unit volumes: the lease-up rendered as an object
   rather than as a chart.

   Constraints this file is built around:
   - One InstancedMesh, one draw call. No GLTF, no imported building.
   - It ARRIVES largely lit and resolves over ~1.2s. It does not fill from
     zero, because a partially filled container animating upward reads as a
     page still loading, which is the worst possible first impression.
   - The unlit units cluster as one corner notch (see lib/stack-layout.ts).
   - Material work carries the quality: per-instance roughness variation,
     warm emissive interiors, a brass rim light, cheap baked occlusion.
   - WebGL only. R3F 9 does not fully support the WebGPU renderer.
   ========================================================================== */

export interface Palette {
  paper: string;
  paperRaised: string;
  ink: string;
  inkMuted: string;
  brass: string;
  umber: string;
}

interface Props {
  light: Palette;
  dark: Palette;
}

const UNIT = 0.5;
const GAP = 0.14;
const PITCH = UNIT + GAP;

/** The dark theme's ground is far darker than its ink. */
function isDarkPalette(palette: Palette): boolean {
  return new THREE.Color(palette.paper).getHSL({ h: 0, s: 0, l: 0 }).l < 0.5;
}

/* --------------------------------------------------------------------------
   Per-instance attributes, computed once on the CPU.
   -------------------------------------------------------------------------- */
function useInstanceData(stack: StackLayout) {
  return useMemo(() => {
    const count = stack.units.length;
    const glow = new Float32Array(count);
    const rough = new Float32Array(count);
    const ao = new Float32Array(count);
    const delay = new Float32Array(count);

    // Deterministic pseudo-random, so the composition is identical on every
    // load and across every device. Nothing here is Math.random().
    const noise = (n: number) => {
      const x = Math.sin(n * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    const lit = new Set(
      stack.units.filter((u) => u.lit).map((u) => `${u.col}:${u.row}`),
    );

    stack.units.forEach((unit, i) => {
      glow[i] = unit.lit ? 0.85 + noise(i) * 0.3 : 0;

      // Subtle roughness variation stops the lattice reading as one plastic
      // extrusion under studio light.
      rough[i] = 0.62 + noise(i + 101) * 0.34;

      /* Cheap baked occlusion: a unit hemmed in on all four sides receives
         less light than one on an edge or beside the notch. This is what
         gives the stack its architectural weight, and it costs nothing at
         runtime because it is a static attribute. */
      let neighbors = 0;
      if (lit.has(`${unit.col - 1}:${unit.row}`)) neighbors += 1;
      if (lit.has(`${unit.col + 1}:${unit.row}`)) neighbors += 1;
      if (lit.has(`${unit.col}:${unit.row - 1}`)) neighbors += 1;
      if (lit.has(`${unit.col}:${unit.row + 1}`)) neighbors += 1;
      ao[i] = 1 - (neighbors / 4) * 0.28;

      // Resolve order runs bottom-up with a little scatter, but the window is
      // short enough that it reads as one arrival, not a sequence.
      delay[i] = (unit.row / Math.max(1, stack.rows)) * 0.5 + noise(i + 7) * 0.5;
    });

    return { glow, rough, ao, delay, count };
  }, [stack]);
}

/* --------------------------------------------------------------------------
   The lattice.
   -------------------------------------------------------------------------- */
function Lattice({
  stack,
  palette,
  reduced,
}: {
  stack: StackLayout;
  palette: Palette;
  reduced: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { glow, rough, ao, delay, count } = useInstanceData(stack);
  const reveal = useRef({ value: reduced ? 1 : 0 });

  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(UNIT, UNIT, UNIT * 0.9);
    g.setAttribute("aGlow", new THREE.InstancedBufferAttribute(glow, 1));
    g.setAttribute("aRough", new THREE.InstancedBufferAttribute(rough, 1));
    g.setAttribute("aAo", new THREE.InstancedBufferAttribute(ao, 1));
    g.setAttribute("aDelay", new THREE.InstancedBufferAttribute(delay, 1));
    return g;
  }, [glow, rough, ao, delay]);

  const material = useMemo(() => {
    /* Lit and unlit volumes differ in MATERIAL, not just in brightness.
       Driving the difference through emissive alone flattens everything into
       uniform glowing tiles and throws away the roughness variation and the
       occlusion, which are what make it read as an architectural model. */
    const litColor = new THREE.Color(palette.brass);
    const unlitColor = new THREE.Color(palette.umber);

    /* The notch has to stay a visible VOLUME in both themes. A cluster of
       near-black boxes reads as holes punched through the lattice, which is
       the exact opposite of the claim being made, so umber is pulled toward
       the paper on light and toward the muted ink on dark until the unlit
       units read as a stepped setback rather than as absence. */
    unlitColor.lerp(
      new THREE.Color(isDarkPalette(palette) ? palette.inkMuted : palette.paper),
      isDarkPalette(palette) ? 0.42 : 0.68,
    );

    const m = new THREE.MeshStandardMaterial({
      color: litColor,
      emissive: new THREE.Color(palette.brass),
      // Low: a warm interior light, not a self-illuminated tile.
      emissiveIntensity: 0.28,
      metalness: 0.15,
      roughness: 0.7,
    });

    m.onBeforeCompile = (shader) => {
      shader.uniforms.uReveal = reveal.current;
      shader.uniforms.uLit = { value: litColor };
      shader.uniforms.uUnlit = { value: unlitColor };

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           attribute float aGlow;
           attribute float aRough;
           attribute float aAo;
           attribute float aDelay;
           uniform float uReveal;
           varying float vGlow;
           varying float vRough;
           varying float vAo;`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           // A reveal, not a fill: every volume is present from the first
           // frame and resolves into place. Scale never reaches zero.
           float t = clamp((uReveal - aDelay * 0.4) / 0.6, 0.0, 1.0);
           float e = t * t * (3.0 - 2.0 * t);
           transformed *= mix(0.82, 1.0, e);
           vGlow = aGlow * e;
           vRough = aRough;
           vAo = aAo;`,
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
           uniform vec3 uLit;
           uniform vec3 uUnlit;
           varying float vGlow;
           varying float vRough;
           varying float vAo;`,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
           roughnessFactor = clamp(roughnessFactor * vRough, 0.05, 1.0);`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
           totalEmissiveRadiance *= vGlow;`,
        )
        /* Per-instance albedo and occlusion, applied before lighting
           resolves. aGlow is 0 for the notch, so the step picks the recessive
           material there and the brass everywhere else. */
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
           diffuseColor.rgb = mix(uUnlit, uLit, step(0.001, vGlow)) * vAo;`,
        );
    };

    return m;
  }, [palette]);

  // Place every instance once. The matrix never changes after this, so there
  // is no per-frame CPU work for the lattice at all.
  useEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    const xOffset = ((stack.cols - 1) * PITCH) / 2;
    const yOffset = ((stack.rows - 1) * PITCH) / 2;

    stack.units.forEach((unit, i) => {
      dummy.position.set(
        unit.col * PITCH - xOffset,
        unit.row * PITCH - yOffset,
        0,
      );
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [stack]);

  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (reduced) {
      reveal.current.value = 1;
      return;
    }
    if (reveal.current.value < 1) {
      elapsed.current += delta;
      reveal.current.value = Math.min(1, elapsed.current / motion.stackReveal);
    }
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}

/* --------------------------------------------------------------------------
   Lighting. Re-lit for each theme rather than recolored.
   -------------------------------------------------------------------------- */
function Lighting({ palette, isDark }: { palette: Palette; isDark: boolean }) {
  /* Illuminate with the lightest token the theme has, NOT with `paper`.
     On the dark theme paper is #17120E, so using it as a light color means
     the only real source in the scene is the brass rim and every non-emissive
     volume renders black. Dark mode needs a warm source, which is `ink`. */
  const warm = isDark ? palette.ink : palette.paper;

  return (
    <>
      <ambientLight color={warm} intensity={isDark ? 0.6 : 1.5} />
      {/* Key, high and to the left, as an architectural model under studio
          light rather than a stage. */}
      <directionalLight
        position={[-4, 6, 7]}
        color={warm}
        intensity={isDark ? 1.5 : 2.4}
      />
      {/* Brass rim, raking across the right edge to pick out the notch. */}
      <directionalLight
        position={[6, 2, -3]}
        color={palette.brass}
        intensity={isDark ? 1.6 : 1.4}
      />
      {/* Warm bounce from below, keeping the shadow side from going flat. */}
      <directionalLight
        position={[0, -5, 2]}
        color={palette.inkMuted}
        intensity={isDark ? 0.6 : 0.7}
      />
    </>
  );
}

/* --------------------------------------------------------------------------
   Camera. Drifts slowly, reacts subtly to pointer on desktop.
   No orbit controls, no user-controllable camera, no scroll-jacking.
   -------------------------------------------------------------------------- */
function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera, size } = useThree();
  const target = useRef({ x: 0, y: 0 });
  const time = useRef(0);

  useEffect(() => {
    if (reduced) return;
    // Pointer parallax on fine pointers only. A touch device gets the drift
    // without anything that competes with a scroll gesture.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (event: PointerEvent) => {
      target.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  useFrame((_, delta) => {
    time.current += delta;

    // Slow autonomous drift, so the object is alive even with no pointer.
    const driftX = reduced ? 0 : Math.sin(time.current * 0.18) * 0.55;
    const driftY = reduced ? 0 : Math.cos(time.current * 0.13) * 0.32;

    const wantX = driftX + target.current.x * 0.9;
    const wantY = driftY - target.current.y * 0.5;

    // Critically damped follow, so it never snaps.
    const k = reduced ? 1 : 1 - Math.pow(0.001, delta);
    camera.position.x += (wantX - camera.position.x) * k;
    camera.position.y += (wantY - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
  });

  // Keep the whole stack in frame on a narrow viewport.
  useEffect(() => {
    const portrait = size.width < 640;
    camera.position.z = portrait ? 12.5 : 10.5;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = portrait ? 42 : 36;
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width]);

  return null;
}

/* --------------------------------------------------------------------------
   Root.
   -------------------------------------------------------------------------- */
export default function OccupancyStack({ light, dark }: Props) {
  const stack = useMemo(() => buildStack(), []);
  const [isDark, setDark] = useState(
    () => document.documentElement.dataset.theme === "dark",
  );
  const [active, setActive] = useState(true);
  const host = useRef<HTMLDivElement>(null);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Follow the theme toggle. The stack is re-lit, not recolored.
  useEffect(() => {
    const read = () => setDark(document.documentElement.dataset.theme === "dark");
    document.addEventListener("themechange", read);
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      document.removeEventListener("themechange", read);
      observer.disconnect();
    };
  }, []);

  /* Pause the render loop whenever the canvas is offscreen or the tab is
     hidden. A drifting camera cannot use frameloop="demand", so this is what
     keeps it from burning battery in a background tab. */
  useEffect(() => {
    const node = host.current;
    if (!node) return;

    let visible = true;
    let onscreen = true;
    const update = () => setActive(visible && onscreen);

    const io = new IntersectionObserver(
      ([entry]) => {
        onscreen = entry?.isIntersecting ?? false;
        update();
      },
      { rootMargin: "128px" },
    );
    io.observe(node);

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      update();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const palette = isDark ? dark : light;

  return (
    <div ref={host} className="stack-canvas" aria-hidden="true">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, tiering.maxDpr]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 10.5], fov: 36 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = isDark ? 1.15 : 1.0;
        }}
      >
        <Lighting palette={palette} isDark={isDark} />
        <CameraRig reduced={reduced} />
        <Lattice stack={stack} palette={palette} reduced={reduced} />
      </Canvas>
    </div>
  );
}
