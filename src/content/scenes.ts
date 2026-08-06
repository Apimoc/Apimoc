/* ==========================================================================
   3D SCENES

   One entry per page. Each controls the building shown behind that page and
   how it moves, so the site reads as one continuous piece of architecture
   seen from different angles rather than the same object repeated.

   floors / unitsPerFloor  the size of the building
   occupancy               roughly how many units are lit, 0 to 1
   spin                    how far a full page scroll turns it, in radians
   yaw                     the starting angle, so each page opens on a
                           different face
   ========================================================================== */

export interface Scene {
  floors: number;
  unitsPerFloor: number;
  occupancy: number;
  spin: number;
  yaw: number;
}

export const scenes = {
  /** The landing page. Largest building, most travel. */
  home: { floors: 6, unitsPerFloor: 5, occupancy: 0.78, spin: 1.5, yaw: -0.35 },

  about: { floors: 4, unitsPerFloor: 4, occupancy: 0.7, spin: 0.9, yaw: 0.4 },

  /** Taller stack, since this page is about scale. */
  experience: { floors: 8, unitsPerFloor: 4, occupancy: 0.85, spin: 1.1, yaw: -0.55 },

  work: { floors: 5, unitsPerFloor: 6, occupancy: 0.6, spin: 1.0, yaw: 0.25 },

  credentials: { floors: 3, unitsPerFloor: 5, occupancy: 0.9, spin: 0.8, yaw: -0.2 },

  journal: { floors: 4, unitsPerFloor: 5, occupancy: 0.65, spin: 0.9, yaw: 0.5 },

  contact: { floors: 3, unitsPerFloor: 4, occupancy: 0.95, spin: 0.7, yaw: -0.4 },

  /** A mostly empty building, which is the point on a page that is not there. */
  notFound: { floors: 5, unitsPerFloor: 4, occupancy: 0.12, spin: 1.2, yaw: 0.3 },
} as const satisfies Record<string, Scene>;

export type SceneName = keyof typeof scenes;
