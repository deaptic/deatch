export type SizeWatch = {
  observe: (el: Element) => void;
  unobserve: (el: Element) => void;
  disconnect: () => void;
};

export function createSizeWatch(
  onResize: (entries: ResizeObserverEntry[]) => void,
): SizeWatch {
  let pending: ResizeObserverEntry[] = [];
  let frame = 0;
  const flush = () => {
    frame = 0;
    const entries = pending;
    pending = [];
    onResize(entries);
  };
  const observer = new ResizeObserver((entries) => {
    pending.push(...entries);
    if (frame === 0) frame = requestAnimationFrame(flush);
  });
  return {
    observe: (el) => observer.observe(el),
    unobserve: (el) => observer.unobserve(el),
    disconnect: () => {
      cancelAnimationFrame(frame);
      frame = 0;
      pending = [];
      observer.disconnect();
    },
  };
}
