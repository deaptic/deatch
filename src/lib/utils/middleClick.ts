/// An `onAuxClick` handler that runs `action` on a middle click only.
export function onMiddleClick(action: () => void) {
  return (e: MouseEvent) => {
    if (e.button !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    action();
  };
}

/// An `onMouseDown` handler that stops a middle press starting autoscroll.
export function preventAutoscroll(e: MouseEvent) {
  if (e.button === 1) e.preventDefault();
}
