type Options = {
  history: () => readonly string[];
  value: () => string;
  setValue: (v: string) => void;
  setCursor?: (pos: number) => void;
};

export function createInputHistory(opts: Options) {
  let index = -1;
  let savedDraft = "";

  function step(delta: 1 | -1): boolean {
    const arr = opts.history();
    const next = index + delta;
    if (!arr.length || next < -1 || next >= arr.length) return false;
    if (index === -1) savedDraft = opts.value();
    index = next;
    apply(textAt(next, arr));
    return true;
  }

  function textAt(idx: number, arr: readonly string[]): string {
    return idx === -1 ? savedDraft : arr[idx];
  }

  function apply(text: string) {
    opts.setValue(text);
    queueMicrotask(() => opts.setCursor?.(text.length));
  }

  function reset() {
    index = -1;
    savedDraft = "";
  }

  return { step, reset };
}
