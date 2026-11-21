import { onCleanup } from "solid-js";

export function captureFocusForRestore() {
  const previous = document.activeElement;
  onCleanup(() => {
    if (previous instanceof HTMLElement && document.contains(previous)) {
      previous.focus();
    }
  });
}

export function autofocus(el: HTMLElement): void {
  setTimeout(() => el.focus());
}
