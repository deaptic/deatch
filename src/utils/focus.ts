import { onCleanup } from "solid-js";

export function captureFocusForRestore() {
  const previous = document.activeElement;
  onCleanup(() => {
    if (previous instanceof HTMLElement && document.contains(previous)) {
      previous.focus();
    }
  });
}
