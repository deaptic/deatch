export function playExit(element: Element | undefined): Promise<unknown> {
  if (!element) return Promise.resolve();
  element.setAttribute("data-closing", "");
  const running = element
    .getAnimations({ subtree: true })
    .filter((a) => a instanceof CSSTransition);
  return Promise.all(running.map((a) => a.finished)).catch(() => {});
}
