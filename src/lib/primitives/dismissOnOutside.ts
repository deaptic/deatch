import { onCleanup } from "solid-js";

export type DismissOnOutsideOptions = {
  ref: () => HTMLElement | undefined;
  onDismiss: () => void;
  events?: string[];
  ignoreSelector?: string;
  shouldDismiss?: () => boolean;
};

export function dismissOnOutside(opts: DismissOnOutsideOptions): void {
  const events = opts.events ?? ["mousedown"];
  const handler = (e: Event) => {
    if (opts.shouldDismiss && !opts.shouldDismiss()) return;
    const target = e.target as HTMLElement | null;
    if (opts.ref()?.contains(target)) return;
    if (opts.ignoreSelector && target?.closest(opts.ignoreSelector)) return;
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
