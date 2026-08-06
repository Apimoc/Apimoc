import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import CutawayBuilding, {
  makeSpec,
  UNIT_W,
  UNIT_H,
  DEPTH,
} from "./CutawayBuilding";
import type { Palette } from "./palette";
import { tiering } from "../content/theme";

/* ==========================================================================
   THE SCENE

   One cutaway building, lit like an architectural model under studio light,
   rotating as the page scrolls.

   Lighting is the other half of the realism, alongside the textures. There
   is no HDRI to load (nothing may be fetched from another host), so the
   environment is built from Lightformers: emissive planes arranged around
   the model that the materials then reflect. That is what puts a soft
   gradient across the brick instead of a flat wash.
   ========================================================================== */

interface Props {
  light: Palette;
  dark: Palette;
  floors: number;
  unitsPerFloor: number;
  occupancy: number;
  /** How much of a turn a full page scroll produces, in radians. */
  spin: number;
  /** Starting yaw, so different pages present a different face. */
  yaw: number;
  quality: "high" | "low";
}

/** Page scroll progress, 0 to 1, read without a scroll handler on the main thread. */
function useScrollProgress() {
  const progress = useRef(0);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? window.scrollY / max : 0;
      frame = 0;
    };
    const onScroll = () => {
      // Coalesced into one read per frame, so a fast scroll cannot queue up
      // layout reads and stall the main thread.
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return progress;
}

function Rig({
  progress,
  spin,
  yaw,
  reduced,
  floors,
  unitsPerFloor,
  children,
}: {
  progress: React.RefObject<number>;
  spin: number;
  yaw: number;
  reduced: boolean;
  floors: number;
  unitsPerFloor: number;
  children: React.ReactNode;
}) {
  const pivot = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  const current = useRef({ spin: yaw, lift: 0 });

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  /* Fit the whole building in frame, on both axes, at every viewport.
     Guessing a distance from the floor count alone clips a wide building on
     a narrow panel, which is exactly what happened first time. The width
     used is the rotating diagonal, not the flat elevation, so the model
     never clips as it turns. */
  const distance = useMemo(() => {
    const height = floors * UNIT_H + 0.9;
    const width = unitsPerFloor * UNIT_W;
    const diagonal = Math.hypot(width, DEPTH);

    const narrow = size.width < 700;
    const fov = narrow ? 40 : 32;
    const margin = narrow ? 1.3 : 1.2;

    const vFov = (fov * Math.PI) / 180;
    const aspect = Math.max(0.25, size.width / Math.max(1, size.height));
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

    const forHeight = (height * margin) / 2 / Math.tan(vFov / 2);
    const forWidth = (diagonal * margin) / 2 / Math.tan(hFov / 2);

    return { d: Math.max(forHeight, forWidth), fov };
  }, [floors, unitsPerFloor, size.width, size.height]);

  useEffect(() => {
    camera.position.set(0, 0, distance.d);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = distance.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, distance]);

  useFrame((state, delta) => {
    if (!pivot.current) return;

    const p = progress.current ?? 0;

    /* Scroll drives the turn. Damped rather than bound directly to scroll
       position, so a flung scroll on a phone eases into place instead of
       snapping, and momentum scrolling never looks jittery. */
    const targetSpin = yaw + p * spin + (reduced ? 0 : pointer.current.x * 0.22);
    const targetLift = reduced ? 0 : -pointer.current.y * 0.12;

    const k = reduced ? 1 : 1 - Math.pow(0.0015, delta);
    current.current.spin += (targetSpin - current.current.spin) * k;
    current.current.lift += (targetLift - current.current.lift) * k;

    pivot.current.rotation.y = current.current.spin;
    pivot.current.rotation.x = current.current.lift;

    /* The camera rides down the elevation as you scroll, so you travel
       through the floors rather than just watching it turn. Kept modest so
       the building never leaves the frame it was fitted to. */
    const travel = reduced ? 0 : (0.5 - p) * floors * UNIT_H * 0.22;
    camera.position.y += (travel - camera.position.y) * k;
    camera.lookAt(0, travel * 0.5, 0);
  });

  return <group ref={pivot}>{children}</group>;
}

export default function BuildingScene({
  light,
  dark,
  floors,
  unitsPerFloor,
  occupancy,
  spin,
  yaw,
  quality,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [isDark, setDark] = useState(
    () => document.documentElement.dataset.theme === "dark",
  );
  const [active, setActive] = useState(true);
  const progress = useScrollProgress();

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const read = () =>
      setDark(document.documentElement.dataset.theme === "dark");
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

  /* Stop rendering entirely when the canvas is off screen or the tab is in
     the background. With a scene on every page this is what keeps the site
     from being a battery drain. */
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
      { rootMargin: "160px" },
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
  const spec = useMemo(
    () => makeSpec(floors, unitsPerFloor, occupancy),
    [floors, unitsPerFloor, occupancy],
  );

  const high = quality === "high";

  return (
    <div ref={host} className="scene-canvas" aria-hidden="true">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, high ? tiering.maxDpr : 1.25]}
        shadows={high ? "soft" : false}
        gl={{
          antialias: high,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 12], fov: 34 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = isDark ? 1.05 : 1.15;
        }}
      >
        {/* Key light, high and to the left, raking across the brick. */}
        <directionalLight
          position={[-6, 9, 7]}
          intensity={isDark ? 1.3 : 2.6}
          color={isDark ? palette.ink : palette.paper}
          castShadow={high}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0012}
        >
          <orthographicCamera attach="shadow-camera" args={[-12, 12, 12, -12, 0.1, 40]} />
        </directionalLight>

        {/* Warm bounce from the ground plane. */}
        <directionalLight
          position={[3, -5, 4]}
          intensity={isDark ? 0.4 : 0.65}
          color={palette.brass}
        />

        <ambientLight intensity={isDark ? 0.35 : 0.7} color={palette.paperRaised} />

        {/* The environment, built rather than downloaded. These emissive
            panels are what the brick and the window trim reflect, and they
            are the difference between a lit model and a flat one. */}
        <Environment resolution={high ? 256 : 128}>
          <Lightformer
            intensity={isDark ? 0.6 : 1.6}
            color={palette.paper}
            position={[0, 6, -9]}
            scale={[12, 6, 1]}
          />
          <Lightformer
            intensity={isDark ? 1.1 : 0.9}
            color={palette.brass}
            position={[-8, 1, 4]}
            scale={[3, 8, 1]}
          />
          <Lightformer
            intensity={isDark ? 0.5 : 1.1}
            color={palette.paperRaised}
            position={[8, 3, 5]}
            scale={[3, 8, 1]}
          />
          <Lightformer
            intensity={isDark ? 0.25 : 0.7}
            color={palette.inkMuted}
            position={[0, -7, 2]}
            scale={[10, 3, 1]}
          />
        </Environment>

        <Rig
          progress={progress}
          spin={spin}
          yaw={yaw}
          reduced={reduced}
          floors={floors}
          unitsPerFloor={unitsPerFloor}
        >
          <CutawayBuilding spec={spec} palette={palette} isDark={isDark} />
        </Rig>

        {high && (
          <ContactShadows
            position={[0, -(floors * UNIT_H) / 2 - 0.4, 0]}
            opacity={isDark ? 0.5 : 0.42}
            scale={22}
            blur={2.6}
            far={6}
            color={palette.umber}
          />
        )}
      </Canvas>
    </div>
  );
}
