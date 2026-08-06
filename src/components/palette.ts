/**
 * The palette the 3D scene works in.
 *
 * The first six come straight from tokens.css so the architecture sits in the
 * site's colour world. The rest are material colours that only exist in the
 * 3D scene: brick, mortar, render, concrete, roofing and window trim. They
 * are derived from the tokens rather than picked separately, which is why the
 * building never looks pasted on top of the page.
 */
export interface Palette {
  paper: string;
  paperRaised: string;
  ink: string;
  inkMuted: string;
  brass: string;
  umber: string;

  brickBase: string;
  mortar: string;
  stucco: string;
  concrete: string;
  roof: string;
  trim: string;
}
