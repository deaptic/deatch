import { onCleanup, onMount } from "solid-js";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.offsetParent !== null,
  );
}

export function trapFocus(root: () => HTMLElement | undefined): void {
  onMount(() => {
    const el = root();
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const all = focusables(el);
      const first = all[0];
      const last = all.at(-1);
      if (!first || !last) {
        e.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !el.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !el.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener("keydown", onKeyDown);
    const timer = setTimeout(() => {
      if (!el.contains(document.activeElement))
        (focusables(el)[0] ?? el).focus();
    });
    onCleanup(() => {
      clearTimeout(timer);
      el.removeEventListener("keydown", onKeyDown);
    });
  });
}
