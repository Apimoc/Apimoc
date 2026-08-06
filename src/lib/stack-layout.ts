import { occupancy } from "../content/site";

/**
 * Shared geometry for the Occupancy Stack.
 *
 * The 3D lattice and the SVG fallback both read from this, so the two are
 * genuinely the same object drawn two ways: same dimensions, same notch, same
 * counts. If they were computed separately they would drift the first time a
 * number changed.
 *
 * THE NOTCH
 * Scattering the unlit units through the lattice reads as vacancy, which is
 * the opposite of the claim being made. Instead the unlit units are seeded to
 * cluster into a single rectangular cut at one corner, which reads as
 * architecture. The label names the number, which turns the voids from holes
 * into evidence of pace.
 */

export interface StackUnit {
  index: number;
  col: number;
  row: number;
  lit: boolean;
}

export interface StackLayout {
  units: StackUnit[];
  cols: number;
  rows: number;
  total: number;
  leased: number;
  unlit: number;
  /** Percentage, rounded, for the text equivalent. */
  percent: number;
}

export function buildStack(
  total: number = occupancy.totalUnits,
  leased: number = occupancy.leasedUnits,
  cols: number = occupancy.unitsPerFloor,
): StackLayout {
  const safeCols = Math.max(1, cols);
  const rows = Math.ceil(total / safeCols);
  const unlit = Math.max(0, total - leased);

  /* Shape the notch as a compact rectangle anchored to the top right corner
     of the lattice, which is where a real building steps back. Width is
     capped so the cut never spans the whole elevation and start reading as a
     missing floor. */
  const notchW = Math.max(1, Math.min(safeCols - 1, Math.ceil(Math.sqrt(unlit))));
  const notchH = notchW > 0 ? Math.ceil(unlit / notchW) : 0;

  const units: StackUnit[] = [];
  for (let index = 0; index < total; index += 1) {
    units.push({
      index,
      col: index % safeCols,
      row: Math.floor(index / safeCols),
      lit: true,
    });
  }

  const at = new Map(units.map((u) => [`${u.col}:${u.row}`, u]));

  /* Cut the notch from the top right corner, working along each row from the
     outer edge inward and then down. Filling in this order guarantees the
     remainder lands on the INNER edge of the lowest notch row, so the cut
     reads as a stepped setback. Filling by index instead leaves a stray lit
     unit stranded in the outer corner, which reads as a mistake. */
  let placed = 0;
  for (let fromTop = 0; fromTop < notchH && placed < unlit; fromTop += 1) {
    const row = rows - 1 - fromTop;
    for (
      let col = safeCols - 1;
      col >= safeCols - notchW && placed < unlit;
      col -= 1
    ) {
      const unit = at.get(`${col}:${row}`);
      if (unit?.lit) {
        unit.lit = false;
        placed += 1;
      }
    }
  }

  /* An awkward count, or a partly filled top row, can leave a remainder the
     rectangle could not absorb. Take it from the top down so the cut stays
     contiguous rather than sprinkling holes through the lattice. */
  for (let i = units.length - 1; i >= 0 && placed < unlit; i -= 1) {
    const unit = units[i];
    if (unit?.lit) {
      unit.lit = false;
      placed += 1;
    }
  }

  return {
    units,
    cols: safeCols,
    rows,
    total,
    leased: total - placed,
    unlit: placed,
    percent: total > 0 ? Math.round(((total - placed) / total) * 100) : 0,
  };
}
