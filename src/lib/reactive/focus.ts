import { onCleanup } from "solid-js";

export function captureFocusForRestore() {
  const previous = document.activeElement;
  onCleanup(() => {
    if (previous instanceof HTMLElement && document.contains(previous)) {
      previous.focus();
    }
  });
}

/// Focuses an element once it is on screen; as a `ref`, it runs before the
/// element is attached, so the focus waits a turn.
export function autofocus(el: HTMLElement): void {
  setTimeout(() => el.focus());
}
