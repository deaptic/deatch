export type Life = {
  current: () => boolean;
  observe: (
    target: Node,
    options: MutationObserverInit,
    run: () => void,
  ) => void;
  listen: (
    target: EventTarget,
    type: string,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions,
  ) => () => void;
};

export function claimLife(name: string): Life {
  const key = `deatch${name}Instance`;
  const token = crypto.randomUUID();
  const data = document.documentElement.dataset;
  data[key] = token;
  const current = () => data[key] === token;
  return {
    current,
    observe(target, options, run) {
      const observer = new MutationObserver(() => {
        if (current()) run();
        else observer.disconnect();
      });
      observer.observe(target, options);
    },
    listen(target, type, handler, options) {
      const listener = (event: Event) => {
        if (current()) handler(event);
      };
      target.addEventListener(type, listener, options);
      return () => target.removeEventListener(type, listener, options);
    },
  };
}
