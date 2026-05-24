import { createSignal } from "solid-js";

export function createPopover<T extends object = {}>() {
  type State = ({ x: number; y: number } & T) | null;
  const [state, setState] = createSignal<State>(null);

  function open(x: number, y: number, extra: T) {
    setState(() => ({ x, y, ...extra } as State));
  }

  function close() {
    setState(null);
  }

  function update(extra: Partial<T>) {
    setState((s) => (s ? ({ ...s, ...extra } as State) : null));
  }

  return { state, open, close, update };
}
