# Images processed at build time

Put `portrait.jpg` here, then set `assets.portraitReady: true` in
`src/content/site.ts`.

Files in this folder go through Astro's image pipeline: they are converted to
AVIF with a WebP fallback, resized to the widths the layout actually uses, and
given the width and height attributes that stop the page jumping as they load.

That is why the portrait belongs here and not in `public/`. Files in `public/`
are served exactly as uploaded, with no processing.

Supply the portrait at 1400px on the long edge or larger. It is displayed at a
4:5 crop.
