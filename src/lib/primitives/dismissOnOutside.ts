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

export function dismissOnOutside(opts: DismissOnOutsideOptions): void {
  const events = opts.events ?? ["mousedown"];
  const handler = (e: Event) => {
    if (opts.shouldDismiss && !opts.shouldDismiss()) return;
    const target = e.target as HTMLElement | null;
    if (opts.ref()?.contains(target)) return;
    if (opts.opener?.()?.contains(target)) return;
    if (target?.closest(`[${POPOVER_TOGGLE}]`)) return;
    opts.onDismiss();
  };
  for (const ev of events) {
    document.addEventListener(ev, handler, { capture: true });
  }
  onCleanup(() => {
    for (const ev of events) {
      document.removeEventListener(ev, handler, { capture: true });
    }
  });
}
