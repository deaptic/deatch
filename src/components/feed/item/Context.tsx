import { type JSX, Show, useContext } from "solid-js";
import { DensityContext } from "./Item.tsx";

const SPINE =
  "absolute top-1/2 bottom-0 border-l-2 border-t-2 border-ink-faint rounded-tl-sm";

type Props = { children?: JSX.Element; thread?: JSX.Element };

/// Lines above the item; `thread` is the one the item answers, joined to
/// it by a connector.
export default function Context(props: Props) {
  const density = useContext(DensityContext);
  return (
    <div class="col-span-2 row-start-1 grid grid-cols-subgrid">
      <div class="col-start-2">{props.children}</div>
      <Show when={props.thread}>
        {(thread) => (
          <Show
            when={density() === "comfortable"}
            fallback={
              <div data-thread class="col-start-2 flex items-center">
                <span class="h-lh aspect-square mr-1 shrink-0 relative">
                  <span class={`${SPINE} left-0 -right-0.5`} />
                </span>
                <div class="flex-1 min-w-0">{thread()}</div>
              </div>
            }
          >
            <span class="col-start-1 relative">
              <span class={`${SPINE} left-1/2 -ml-px right-1`} />
            </span>
            <div data-thread class="col-start-2">{thread()}</div>
          </Show>
        )}
      </Show>
    </div>
  );
}
