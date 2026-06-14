import {
  type Accessor,
  createEffect,
  createSignal,
  on,
  onCleanup,
} from "solid-js";

type Options<T> = {
  equals?: (a: T, b: T) => boolean;
  immediate?: (next: T, current: T) => boolean;
};

export function createDebounced<T>(
  source: Accessor<T>,
  ms: number,
  options: Options<T> = {},
): Accessor<T> {
  const [value, setValue] = createSignal(source(), { equals: options.equals });
  let timer: number | undefined;

  const clear = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  createEffect(
    on(source, (next) => {
      clear();
      if (!options.immediate || options.immediate(next, value())) {
        setValue(() => next);
        return;
      }
      timer = setTimeout(() => {
        timer = undefined;
        setValue(() => next);
      }, ms);
    }, { defer: true }),
  );

  onCleanup(clear);
  return value;
}
