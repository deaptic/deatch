export type Backoff = ReturnType<typeof createBackoff>;

export function createBackoff(minMs: number, maxMs: number) {
  let delay = minMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    schedule(retry: () => void) {
      if (timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        retry();
      }, delay);
      delay = Math.min(delay * 2, maxMs);
    },
    succeeded() {
      delay = minMs;
    },
    reset() {
      clearTimeout(timer);
      timer = undefined;
      delay = minMs;
    },
  };
}
