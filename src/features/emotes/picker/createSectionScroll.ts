import { createEffect, createSignal, on } from "solid-js";
import type { RenderSection } from "./helpers.ts";

const ALIGN_FRAMES = 12;

export function createSectionScroll(sections: () => RenderSection[]) {
  const [current, setCurrent] = createSignal<string | null>(null);
  let list: HTMLDivElement | undefined;
  let rail: HTMLElement | undefined;

  const sectionEl = (id: string) =>
    list?.querySelector<HTMLElement>(`[data-section-id="${id}"]`);

  function jumpTo(id: string) {
    const el = list;
    if (!el) return;
    let frame = 0;
    const align = () => {
      const target = sectionEl(id);
      if (!target) return;
      const top = Math.min(target.offsetTop, el.scrollHeight - el.clientHeight);
      if (Math.abs(el.scrollTop - top) >= 1) el.scrollTop = top;
      if (++frame < ALIGN_FRAMES) requestAnimationFrame(align);
    };
    align();
  }

  function track() {
    if (!list) return;
    const top = list.scrollTop + 1;
    let found: string | null = null;
    for (const s of sections()) {
      const el = sectionEl(s.id);
      if (el && el.offsetTop <= top) found = s.id;
    }
    setCurrent(found ?? sections()[0]?.id ?? null);
  }

  createEffect(on(sections, () => queueMicrotask(track)));
  createEffect(
    on(current, (id) =>
      rail
        ?.querySelector(`[data-rail-id="${id}"]`)
        ?.scrollIntoView({ block: "nearest" }),
    ),
  );

  return {
    current,
    jumpTo,
    track,
    toTop: () => list?.scrollTo({ top: 0 }),
    setList: (el: HTMLDivElement) => (list = el),
    setRail: (el: HTMLElement) => (rail = el),
  };
}
