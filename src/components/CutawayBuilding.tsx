import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  brickTexture,
  stuccoTexture,
  concreteTexture,
  unitNumberTexture,
} from "../lib/textures";
import type { Palette } from "./palette";

/* ==========================================================================
   THE CUTAWAY

   A multifamily building with its front elevation removed, so you look
   straight into the unit stack: floor slabs, party walls between homes, and
   every unit carrying its own door number. Occupied units are lit from
   within.

   It is one building described in code rather than an imported model, which
   is what lets it re-light for the theme, rebuild at a different unit count,
   and stay small enough to ship.

   Construction, from the back forward:
     1. shell        brick, three sides and a roof
     2. back wall    the numbered unit grid, one texture, one draw call
     3. slabs        exposed concrete floor plates
     4. party walls  vertical dividers between units
     5. mullions     the remains of the removed facade, framing each opening
   ========================================================================== */

export interface BuildingSpec {
  floors: number;
  unitsPerFloor: number;
  /** Which units are lit. Keyed "col:floor". */
  lit: Set<string>;
}

export const UNIT_W = 1.55;
export const UNIT_H = 1.15;
export const DEPTH = 1.5;
const SLAB = 0.11;
const WALL = 0.07;

export function makeSpec(
  floors: number,
  unitsPerFloor: number,
  occupancy: number,
): BuildingSpec {
  const lit = new Set<string>();
  // Deterministic, so the building looks composed rather than random and is
  // identical on every load.
  const rand = (n: number) => {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };
  let index = 0;
  for (let floor = 0; floor < floors; floor += 1) {
    for (let col = 0; col < unitsPerFloor; col += 1) {
      // Lower floors read as fuller, which is how a lease-up actually goes.
      const bias = 1 - floor / (floors * 1.8);
      if (rand(index) < occupancy * bias + 0.12) lit.add(`${col}:${floor}`);
      index += 1;
    }
  }
  return { floors, unitsPerFloor, lit };
}

export default function CutawayBuilding({
  spec,
  palette,
  isDark,
}: {
  spec: BuildingSpec;
  palette: Palette;
  isDark: boolean;
}) {
  const group = useRef<THREE.Group>(null);

  const width = spec.unitsPerFloor * UNIT_W;
  const height = spec.floors * UNIT_H;

  /* --- Materials -------------------------------------------------------- */
  const materials = useMemo(() => {
    const brick = brickTexture(
      isDark ? palette.umber : palette.brickBase,
      isDark ? palette.paperRaised : palette.mortar,
    );
    brick.map.repeat.set(spec.unitsPerFloor * 0.9, spec.floors * 0.55);
    brick.normalMap.repeat.copy(brick.map.repeat);

    const stucco = stuccoTexture(isDark ? palette.paperRaised : palette.stucco);
    stucco.repeat.set(2, 2);

    const concrete = concreteTexture(
      isDark ? palette.umber : palette.concrete,
    );
    concrete.repeat.set(spec.unitsPerFloor, 1);

    const numbers = unitNumberTexture(
      spec.unitsPerFloor,
      spec.floors,
      isDark ? palette.paperRaised : palette.stucco,
      isDark ? palette.ink : palette.inkMuted,
      palette.brass,
      spec.lit,
    );

    return {
      shell: new THREE.MeshStandardMaterial({
        map: brick.map,
        normalMap: brick.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.94,
        metalness: 0.02,
      }),
      interior: new THREE.MeshStandardMaterial({
        map: numbers,
        roughness: 0.85,
        metalness: 0,
        // The lit units glow from the same texture, so occupancy reads
        // instantly without a second material or a second draw call.
        emissiveMap: numbers,
        emissive: new THREE.Color(palette.brass),
        emissiveIntensity: isDark ? 0.5 : 0.16,
      }),
      slab: new THREE.MeshStandardMaterial({
        map: concrete,
        roughness: 0.88,
        metalness: 0.03,
      }),
      divider: new THREE.MeshStandardMaterial({
        map: stucco,
        roughness: 0.9,
        metalness: 0,
      }),
      trim: new THREE.MeshStandardMaterial({
        color: new THREE.Color(isDark ? palette.inkMuted : palette.trim),
        roughness: 0.45,
        metalness: 0.25,
      }),
      /* Painted metal railings. More metallic and far smoother than the
         masonry, so they catch the brass rim light and read as a different
         material rather than as more of the same. */
      rail: new THREE.MeshStandardMaterial({
        color: new THREE.Color(isDark ? palette.inkMuted : palette.trim),
        roughness: 0.32,
        metalness: 0.62,
      }),
      roof: new THREE.MeshStandardMaterial({
        color: new THREE.Color(isDark ? palette.umber : palette.roof),
        roughness: 0.8,
        metalness: 0.1,
      }),
    };
  }, [palette, isDark, spec]);

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        mat.map?.dispose();
        mat.normalMap?.dispose();
        mat.dispose();
      });
    };
  }, [materials]);

  /* --- Instanced geometry ------------------------------------------------
     Slabs, party walls and mullions are each one InstancedMesh, so the whole
     interior costs three draw calls no matter how many units there are. */
  const slabs = useRef<THREE.InstancedMesh>(null);
  const walls = useRef<THREE.InstancedMesh>(null);
  const mullions = useRef<THREE.InstancedMesh>(null);
  const rails = useRef<THREE.InstancedMesh>(null);
  const posts = useRef<THREE.InstancedMesh>(null);

  const counts = useMemo(
    () => ({
      slabs: spec.floors + 1,
      walls: (spec.unitsPerFloor + 1) * spec.floors,
      mullions: spec.unitsPerFloor * spec.floors + spec.unitsPerFloor + 1,
      // Two horizontal rails per opening, plus a row of balusters.
      rails: spec.unitsPerFloor * spec.floors * 2,
      posts: spec.unitsPerFloor * spec.floors * 5,
    }),
    [spec],
  );

  useEffect(() => {
    const dummy = new THREE.Object3D();

    if (slabs.current) {
      for (let i = 0; i <= spec.floors; i += 1) {
        dummy.position.set(0, i * UNIT_H - height / 2, 0);
        dummy.scale.set(width, SLAB, DEPTH);
        dummy.updateMatrix();
        slabs.current.setMatrixAt(i, dummy.matrix);
      }
      slabs.current.instanceMatrix.needsUpdate = true;
    }

    if (walls.current) {
      let n = 0;
      for (let floor = 0; floor < spec.floors; floor += 1) {
        for (let col = 0; col <= spec.unitsPerFloor; col += 1) {
          dummy.position.set(
            col * UNIT_W - width / 2,
            floor * UNIT_H - height / 2 + UNIT_H / 2,
            0,
          );
          dummy.scale.set(WALL, UNIT_H - SLAB, DEPTH);
          dummy.updateMatrix();
          walls.current.setMatrixAt(n, dummy.matrix);
          n += 1;
        }
      }
      walls.current.instanceMatrix.needsUpdate = true;
    }

    /* What is left of the facade after the cut: a spandrel band under every
       opening and a pier at every party wall. Without these the openings
       have no frame and the whole thing reads as open shelving, which is
       exactly how the first version looked. */
    if (mullions.current) {
      let n = 0;
      const SPANDREL = UNIT_H * 0.26;

      for (let floor = 0; floor < spec.floors; floor += 1) {
        for (let col = 0; col < spec.unitsPerFloor; col += 1) {
          dummy.position.set(
            col * UNIT_W - width / 2 + UNIT_W / 2,
            floor * UNIT_H - height / 2 + SPANDREL / 2,
            DEPTH / 2 - 0.02,
          );
          dummy.scale.set(UNIT_W, SPANDREL, 0.13);
          dummy.updateMatrix();
          mullions.current.setMatrixAt(n, dummy.matrix);
          n += 1;
        }
      }

      // Vertical piers, full height, on the party wall lines.
      for (let col = 0; col <= spec.unitsPerFloor; col += 1) {
        dummy.position.set(
          col * UNIT_W - width / 2,
          0,
          DEPTH / 2 - 0.02,
        );
        dummy.scale.set(0.15, height, 0.13);
        dummy.updateMatrix();
        mullions.current.setMatrixAt(n, dummy.matrix);
        n += 1;
      }

      mullions.current.instanceMatrix.needsUpdate = true;
    }

    /* Balcony railings across every opening. This is the single detail that
       stops the cutaway reading as shelving: a horizontal rail at waist
       height with balusters under it is unmistakably a place people live,
       and it is what the eye uses to judge the scale of everything else. */
    const railY = (floor: number) =>
      floor * UNIT_H - height / 2 + UNIT_H * 0.34;

    if (rails.current) {
      let n = 0;
      for (let floor = 0; floor < spec.floors; floor += 1) {
        for (let col = 0; col < spec.unitsPerFloor; col += 1) {
          const cx = col * UNIT_W - width / 2 + UNIT_W / 2;
          // Top rail, then the bottom kick rail.
          for (const [dy, thickness] of [
            [UNIT_H * 0.13, 0.045],
            [-UNIT_H * 0.1, 0.03],
          ] as const) {
            dummy.position.set(cx, railY(floor) + dy, DEPTH / 2 - 0.09);
            dummy.scale.set(UNIT_W * 0.86, thickness, thickness);
            dummy.updateMatrix();
            rails.current.setMatrixAt(n, dummy.matrix);
            n += 1;
          }
        }
      }
      rails.current.instanceMatrix.needsUpdate = true;
    }

    if (posts.current) {
      let n = 0;
      const BALUSTERS = 5;
      for (let floor = 0; floor < spec.floors; floor += 1) {
        for (let col = 0; col < spec.unitsPerFloor; col += 1) {
          const left = col * UNIT_W - width / 2 + UNIT_W * 0.07;
          const span = UNIT_W * 0.86;
          for (let b = 0; b < BALUSTERS; b += 1) {
            dummy.position.set(
              left + (span * (b + 0.5)) / BALUSTERS,
              railY(floor),
              DEPTH / 2 - 0.09,
            );
            dummy.scale.set(0.028, UNIT_H * 0.24, 0.028);
            dummy.updateMatrix();
            posts.current.setMatrixAt(n, dummy.matrix);
            n += 1;
          }
        }
      }
      posts.current.instanceMatrix.needsUpdate = true;
    }
  }, [spec, width, height]);

  /* Very slow idle drift, so the model breathes even when nobody scrolls.
     The scroll-driven rotation is applied by the parent. */
  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.4) * 0.035;
  });

  return (
    <group ref={group}>
      {/* Back and side shell, brick. Rendered as three planes rather than a
          box so the open front stays genuinely open. */}
      <mesh
        position={[0, 0, -DEPTH / 2]}
        material={materials.shell}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, height, 0.12]} />
      </mesh>
      <mesh
        position={[-width / 2, 0, 0]}
        material={materials.shell}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.12, height, DEPTH]} />
      </mesh>
      <mesh
        position={[width / 2, 0, 0]}
        material={materials.shell}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.12, height, DEPTH]} />
      </mesh>

      {/* The numbered unit grid, sitting just in front of the back shell. */}
      <mesh position={[0, 0, -DEPTH / 2 + 0.07]} material={materials.interior}>
        <planeGeometry args={[width - 0.12, height]} />
      </mesh>

      {/* Roof, with a small overhang so it casts a real shadow line. */}
      <mesh
        position={[0, height / 2 + 0.09, 0]}
        material={materials.roof}
        castShadow
      >
        <boxGeometry args={[width + 0.34, 0.18, DEPTH + 0.34]} />
      </mesh>

      {/* Plinth. A building that floats reads as a diagram; one that sits on
          a base reads as architecture, and it gives the contact shadow
          something to fall on. */}
      <mesh
        position={[0, -height / 2 - 0.16, 0]}
        material={materials.roof}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[width + 0.5, 0.3, DEPTH + 0.5]} />
      </mesh>

      <instancedMesh
        ref={slabs}
        args={[undefined, materials.slab, counts.slabs]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      <instancedMesh
        ref={walls}
        args={[undefined, materials.divider, counts.walls]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      <instancedMesh
        ref={mullions}
        args={[undefined, materials.shell, counts.mullions]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      <instancedMesh
        ref={rails}
        args={[undefined, materials.rail, counts.rails]}
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      <instancedMesh
        ref={posts}
        args={[undefined, materials.rail, counts.posts]}
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}
