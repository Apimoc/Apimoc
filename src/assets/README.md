# Images processed at build time

Four kinds of image belong here:

| File | Displayed at | Then set in `src/content/site.ts` |
|---|---|---|
| `portrait.jpg` | 4:5 crop, under an arch | `assets.portraitReady: true` |
| `hero.jpg` | Full-bleed background | `assets.heroReady: true` |
| `guidebook.jpg` | 3:4 crop | `assets.guidebookReady: true` |
| `listings/*.jpg` | 3:2 crop | named in each listing's `image:` field |

Supply each at 1400px on the long edge or larger. Larger is fine; the build
resizes down and never up.

Files in this folder go through Astro's image pipeline: they are converted to
AVIF with a WebP fallback, resized to the widths the layout actually uses, and
given the width and height attributes that stop the page jumping as they load.

That is why these belong here and not in `public/`. Files in `public/` are
served exactly as uploaded, with no processing.

Until a file arrives, its slot draws a designed plate at exactly the same
aspect ratio, so adding the real photo shifts nothing on the page.
