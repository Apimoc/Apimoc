import { tiering } from "../content/theme";
import { features } from "../content/site";

/**
 * Mounts the 3D scene on whichever page is showing.
 *
 * The flat elevation is server-rendered and already on screen, so nothing
 * here is on the critical path. The island loads only after the main thread
 * is idle, only when the canvas is near the viewport, and only on devices
 * that can carry it.
 *
 * Devices that cannot get the elevation instead, which is a finished drawing
 * rather than a degraded one.
 */

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

type Quality = "high" | "low" | "none";

function assessDevice(): Quality {
  if (!features.buildingScene) return "none";

  // A moving building is the whole point, so reduced motion gets the flat
  // elevation rather than a frozen 3D frame.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "none";
  }

  const connection = (navigator as Navigator & {
    connection?: NetworkInformation;
  }).connection;
  if (connection?.saveData) return "none";
  if (connection?.effectiveType && /^(slow-)?2g$/.test(connection.effectiveType)) {
    return "none";
  }

  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 4;

  // WebGL only. R3F 9 does not fully support the WebGPU renderer.
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  try {
    const probe = document.createElement("canvas");
    gl =
      (probe.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (probe.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) return "none";
  } catch {
    return "none";
  }

  // Software renderers report themselves. Shadows on SwiftShader are painful.
  let software = false;
  try {
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (info) {
      const renderer = String(
        gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? "",
      ).toLowerCase();
      software = /swiftshader|llvmpipe|software|microsoft basic/.test(renderer);
    }
  } catch {
    // Some browsers hide this. Fall through on the other signals.
  }

  (gl.getExtension("WEBGL_lose_context") as { loseContext(): void } | null)
    ?.loseContext();

  if (typeof memory === "number" && memory <= tiering.minDeviceMemoryGb) {
    return "low";
  }
  if (cores <= 4 || software) return "low";
  return "high";
}

function whenIdle(run: () => void) {
  const idle = (window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
  }).requestIdleCallback;

  if (typeof idle === "function") idle.call(window, run, { timeout: 2200 });
  else window.setTimeout(run, 800);
}

let disposer: (() => void) | null = null;

export function mountScenes() {
  // A previous page's scene must be torn down before the next one mounts, or
  // two WebGL contexts stack up on every navigation.
  disposer?.();
  disposer = null;

  const host = document.querySelector<HTMLElement>("[data-scene-host]");
  const fallback = document.querySelector<HTMLElement>("[data-scene-fallback]");
  if (!host || host.dataset.mounted === "true") return;

  const quality = assessDevice();
  if (quality === "none") return;

  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      io.disconnect();

      whenIdle(async () => {
        try {
          const [{ createRoot }, React, { default: BuildingScene }] =
            await Promise.all([
              import("react-dom/client"),
              import("react"),
              import("../components/BuildingScene"),
            ]);

          const config = JSON.parse(host.dataset.sceneConfig ?? "{}");
          if (!config.light || !config.dark) return;

          host.dataset.mounted = "true";
          // Recorded so the tier a device actually got is observable, both
          // in devtools and in the verification suite.
          host.dataset.quality = quality;
          const root = createRoot(host);
          root.render(React.createElement(BuildingScene, { ...config, quality }));

          // The elevation only steps aside once the real thing is up, so a
          // failure part way through leaves a finished drawing on screen.
          requestAnimationFrame(() => {
            if (fallback) fallback.dataset.replaced = "true";
            window.dispatchEvent(new Event("scene:mounted"));
          });

          disposer = () => {
            root.unmount();
            host.dataset.mounted = "false";
            if (fallback) delete fallback.dataset.replaced;
          };
        } catch {
          // Context creation can still fail after the probe passed, for
          // example when the browser has hit its WebGL context limit.
          if (fallback) delete fallback.dataset.replaced;
        }
      });
    },
    { rootMargin: "220px" },
  );

  io.observe(host);

  document.addEventListener(
    "astro:before-swap",
    () => {
      io.disconnect();
      disposer?.();
      disposer = null;
    },
    { once: true },
  );
}
