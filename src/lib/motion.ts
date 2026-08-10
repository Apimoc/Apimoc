import { motion } from "../content/theme";
import { features } from "../content/site";

/**
 * One reveal language, used everywhere.
 *
 * Line-masked reveals on headings via SplitText, a short upward translate
 * with opacity on body blocks, staggered. There is deliberately no
 * per-section transition: the whole page speaks one motion dialect.
 *
 * GSAP IS NOT IMPORTED AT THE TOP OF THIS FILE, ON PURPOSE.
 * GSAP core, ScrollTrigger and SplitText together are roughly 50 kB gzipped,
 * which is the entire per-route JavaScript budget on its own. Importing them
 * statically puts them in the shared chunk that every single route loads,
 * before anything has painted. They are dynamically imported instead, after
 * the page is interactive, so no route pays for them on the critical path.
 *
 * The reduced-motion check happens BEFORE the import, so a visitor who has
 * asked for less motion never downloads an animation library at all. That is
 * the accessibility preference and the performance win pointing the same way.
 *
 * GSAP has been free for commercial use including SplitText since April 2025,
 * so there is no licensing consideration here.
 */

type Gsap = typeof import("gsap").default;
type ScrollTriggerType = typeof import("gsap/ScrollTrigger").ScrollTrigger;

let gsap: Gsap | null = null;
let ScrollTrigger: ScrollTriggerType | null = null;
let lenis: { destroy: () => void; raf: (t: number) => void } | null = null;
let mm: ReturnType<Gsap["matchMedia"]> | null = null;
/** Held so the ticker callback can be removed, rather than stacking up one
    extra callback per client-side navigation. */
let tick: ((time: number) => void) | null = null;
let loading: Promise<void> | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function load() {
  if (gsap && ScrollTrigger) return;
  if (!loading) {
    loading = (async () => {
      const [core, st, split] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("gsap/SplitText"),
      ]);
      gsap = core.default;
      ScrollTrigger = st.ScrollTrigger;
      gsap.registerPlugin(st.ScrollTrigger, split.SplitText);
      (gsap as unknown as { __split: typeof split.SplitText }).__split =
        split.SplitText;
    })();
  }
  return loading;
}

function reveals(scope: Document | HTMLElement) {
  if (!gsap) return;
  const SplitText = (gsap as unknown as { __split: new (
    target: Element,
    config: Record<string, unknown>,
  ) => { lines: Element[] } }).__split;

  // Headings: mask each line and let it rise into place.
  scope.querySelectorAll<HTMLElement>("[data-reveal='lines']").forEach((el) => {
    const split = new SplitText(el, {
      type: "lines",
      linesClass: "reveal-line",
      // Wrap each line so the mask has something to clip against.
      mask: "lines",
    });
    gsap!.set(el, { opacity: 1 });
    gsap!.from(split.lines, {
      yPercent: 110,
      duration: motion.revealDuration,
      ease: "power3.out",
      stagger: motion.stagger,
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  // Body blocks: short upward translate with opacity.
  scope.querySelectorAll<HTMLElement>("[data-reveal='block']").forEach((el) => {
    gsap!.fromTo(
      el,
      { opacity: 0, y: motion.travel },
      {
        opacity: 1,
        y: 0,
        duration: motion.revealDuration,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      },
    );
  });

  // Ruled rows: the same translate, staggered down the group.
  scope.querySelectorAll<HTMLElement>("[data-reveal='rows']").forEach((el) => {
    const rows = el.querySelectorAll(":scope > *");
    gsap!.fromTo(
      rows,
      { opacity: 0, y: motion.travel },
      {
        opacity: 1,
        y: 0,
        duration: motion.revealDuration,
        ease: "power3.out",
        stagger: motion.stagger,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      },
    );
    gsap!.set(el, { opacity: 1 });
  });
}

async function startSmoothScroll() {
  if (!features.smoothScroll || !gsap || !ScrollTrigger) return;
  // Desktop pointer devices only. Nothing on this site should ever feel like
  // it is fighting a thumb.
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (navigator.maxTouchPoints > 0) return;

  const { default: Lenis } = await import("lenis");
  const instance = new Lenis({ autoRaf: false, duration: 0.9 });
  lenis = instance;

  instance.on("scroll", ScrollTrigger.update);
  tick = (time: number) => instance.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
}

function teardown() {
  mm?.revert();
  mm = null;
  ScrollTrigger?.getAll().forEach((t) => t.kill());
  if (tick && gsap) {
    gsap.ticker.remove(tick);
    tick = null;
  }
  lenis?.destroy();
  lenis = null;
  document.documentElement.classList.remove("is-armed");
}

export async function initMotion() {
  teardown();

  /* Checked before the import, so reduced motion costs zero bytes. Content is
     already in its final position: nothing is hidden until `is-armed` is
     added below, which only happens once GSAP has actually loaded. */
  if (prefersReducedMotion()) return;

  await load();
  if (!gsap || !ScrollTrigger) return;

  mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    document.documentElement.classList.add("is-armed");
    reveals(document);
    void startSmoothScroll();

    /* Trigger positions are measured at creation, and web fonts swapping in
       changes text height after that. Without a refresh, every trigger below
       the fold keeps its stale start position and sections silently never
       reveal. */
    document.fonts?.ready.then(() => ScrollTrigger?.refresh());
  
    return () => {
      document.documentElement.classList.remove("is-armed");
    };
  });
}

/**
 * Restores the chosen theme after a view transition swaps the document.
 * Mirrors the pre-paint script exactly, including its dark default: if the
 * two disagreed, the theme would flip on the first client-side navigation.
 */
export function reapplyTheme() {
  const root = document.documentElement;
  try {
    const stored = localStorage.getItem("theme");
    const dark = stored ? stored !== "light" : true;
    root.dataset.theme = dark ? "dark" : "light";
    root.style.colorScheme = dark ? "dark" : "light";
  } catch {
    root.dataset.theme = "dark";
    root.style.colorScheme = "dark";
  }
}
