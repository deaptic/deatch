import { type Accessor, createEffect, createSignal, on } from "solid-js";

type Shown<T> = T | undefined | null | false;

export function createPresence<T>(
  source: Accessor<Shown<T>>,
  exit: () => Promise<unknown>,
) {
  const [value, setValue] = createSignal<Shown<T>>(source());
  const [closing, setClosing] = createSignal(false);
  let generation = 0;

  async function close(current: number) {
    setClosing(true);
    await exit();
    if (current !== generation) return;
    setClosing(false);
    setValue(undefined);
  }

  createEffect(
    on(
      source,
      (next) => {
        const current = ++generation;
        if (next) {
          setClosing(false);
          setValue(() => next);
        } else if (value()) {
          void close(current);
        }
      },
      { defer: true },
    ),
  );

  return { value, closing };
}
