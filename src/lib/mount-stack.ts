import { tiering } from "../content/theme";
import { features } from "../content/site";

/**
 * Decides whether this device gets the 3D stack, and mounts it if so.
 *
 * The SVG fallback is what the server renders, so it is already on screen and
 * already correct before any of this runs. Nothing here is on the critical
 * path: the island is imported only after the main thread goes idle AND the
 * canvas is near the viewport, so it can never block LCP or hydration.
 */

interface NetworkInformation {
  saveData?: boolean;
}

function tierAllows(): boolean {
  if (!features.occupancyStack3D) return false;

  // Reduced motion gets the fallback outright. The 3D stack is a moving
  // object by definition, and a static render of it would be worse than the
  // SVG, which was designed to be still.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  const connection = (navigator as Navigator & {
    connection?: NetworkInformation;
  }).connection;
  if (connection?.saveData) return false;

  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  if (typeof memory === "number" && memory <= tiering.minDeviceMemoryGb) {
    return false;
  }

  // WebGL only. R3F 9 does not fully support the WebGPU renderer, so this
  // deliberately does not probe for one.
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl");
    if (!gl) return false;
    // Release the probe context immediately rather than holding one of the
    // browser's limited slots.
    (gl.getExtension("WEBGL_lose_context") as { loseContext(): void } | null)
      ?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function whenIdle(run: () => void) {
  // Safari has no requestIdleCallback. Read it off first rather than using an
  // `in` narrowing, which collapses `window` to `never` in the else branch.
  const idle = (window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
  }).requestIdleCallback;

  if (typeof idle === "function") {
    idle.call(window, run, { timeout: 2500 });
  } else {
    window.setTimeout(run, 900);
  }
}

export function mountStack() {
  const host = document.querySelector<HTMLElement>("[data-stack-host]");
  const fallback = document.querySelector<HTMLElement>("[data-stack-fallback]");
  if (!host || host.dataset.mounted === "true") return;
  if (!tierAllows()) return;

  const start = () => {
    whenIdle(async () => {
      try {
        const [{ createRoot }, React, { default: OccupancyStack }] =
          await Promise.all([
            import("react-dom/client"),
            import("react"),
            import("../components/OccupancyStack"),
          ]);

        const palettes = JSON.parse(host.dataset.palettes ?? "{}");
        if (!palettes.light || !palettes.dark) return;

        host.dataset.mounted = "true";
        const root = createRoot(host);
        root.render(
          React.createElement(OccupancyStack, {
            light: palettes.light,
            dark: palettes.dark,
          }),
        );

        // Only retire the fallback once the real thing is actually up, so a
        // failure part way through leaves a complete design on screen rather
        // than a hole.
        requestAnimationFrame(() => {
          if (fallback) fallback.dataset.replaced = "true";
          // Layout below this point has just changed, so scroll triggers
          // need to remeasure or they keep firing against stale positions.
          window.dispatchEvent(new Event("stack:mounted"));
        });

        document.addEventListener(
          "astro:before-swap",
          () => {
            root.unmount();
            host.dataset.mounted = "false";
          },
          { once: true },
        );
      } catch {
        // WebGL context creation can still fail after the probe passed, for
        // example on a machine that has hit its context limit. The fallback
        // is untouched and stays visible.
        if (fallback) delete fallback.dataset.replaced;
      }
    });
  };

  // Wait until the canvas is close to the viewport before spending anything.
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        io.disconnect();
        start();
      }
    },
    { rootMargin: "200px" },
  );
  io.observe(host);
}
