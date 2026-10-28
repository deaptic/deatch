export type Backoff = ReturnType<typeof createBackoff>;

/// Retries on a delay that doubles after each one, up to `maxMs`.
export function createBackoff(minMs: number, maxMs: number) {
  let delay = minMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    /// Does nothing while a retry is already pending.
    schedule(retry: () => void) {
      if (timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        retry();
      }, delay);
      delay = Math.min(delay * 2, maxMs);
    },
    /// The next failure waits the shortest delay again.
    succeeded() {
      delay = minMs;
    },
    /// Cancels the pending retry and starts over.
    reset() {
      clearTimeout(timer);
      timer = undefined;
      delay = minMs;
    },
  };
}
