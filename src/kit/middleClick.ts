export function onMiddleClick(action: () => void) {
  return (e: MouseEvent) => {
    if (e.button !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    action();
  };
}

export function preventAutoscroll(e: MouseEvent) {
  if (e.button === 1) e.preventDefault();
}
