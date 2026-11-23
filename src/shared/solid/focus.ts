import { onCleanup } from "solid-js";

export function captureFocusForRestore(): () => void {
  let previous: Element | null = document.activeElement;
  function restore() {
    if (previous instanceof HTMLElement && document.contains(previous)) {
      previous.focus();
    }
    previous = null;
  }
  onCleanup(restore);
  return restore;
}

export function autofocus(el: HTMLElement): void {
  setTimeout(() => el.focus());
}
