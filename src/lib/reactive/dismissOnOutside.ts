import { onCleanup } from "solid-js";

/// Elements that open or close an overlay carry this attribute so the
/// mousedown that toggles them is not also counted as an outside click.
export const POPOVER_TOGGLE = "data-popover-toggle";

export type DismissOnOutsideOptions = {
  ref: () => HTMLElement | undefined;
  opener?: () => HTMLElement | undefined;
  onDismiss: () => void;
  events?: string[];
  shouldDismiss?: () => boolean;
};

/// Overlays in the order they opened. One opened from inside another (a menu
/// from a user card) renders elsewhere, so the outer one must not count
/// clicks in it as outside.
const stack: (() => HTMLElement | undefined)[] = [];

const insideLater = (ref: () => HTMLElement | undefined, target: Node) =>
  stack.slice(stack.indexOf(ref) + 1).some((r) => r()?.contains(target));

export function dismissOnOutside(opts: DismissOnOutsideOptions): void {
  const events = opts.events ?? ["mousedown"];
  stack.push(opts.ref);
  const handler = (e: Event) => {
    if (opts.shouldDismiss && !opts.shouldDismiss()) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (opts.ref()?.contains(target)) return;
    if (opts.opener?.()?.contains(target)) return;
    if (target.closest(`[${POPOVER_TOGGLE}]`)) return;
    if (insideLater(opts.ref, target)) return;
    opts.onDismiss();
  };
  for (const ev of events) {
    document.addEventListener(ev, handler, { capture: true });
  }
  onCleanup(() => {
    stack.splice(stack.indexOf(opts.ref), 1);
    for (const ev of events) {
      document.removeEventListener(ev, handler, { capture: true });
    }
  });
}
