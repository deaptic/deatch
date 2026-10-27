import { type JSX, Show, useContext } from "solid-js";
import { DensityContext } from "./Item.tsx";

type Props = { children?: JSX.Element; thread?: JSX.Element };

/// Lines above the item; `thread` is the one the item answers, marked by
/// a hook that points down at it: at the avatar when spacious, at the first
/// badge when compact.
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
              <div class="col-start-2 flex items-center">
                <span class="h-lh w-feed-badge mr-1 shrink-0 relative">
                  <Hook class="right-0" />
                </span>
                <div class="flex-1 min-w-0">{thread()}</div>
              </div>
            }
          >
            <span class="col-start-1 relative w-(--chat-tile) mr-3">
              <Hook class="-right-2" />
            </span>
            <div class="col-start-2">{thread()}</div>
          </Show>
        )}
      </Show>
    </div>
  );
}

/// Drops a fixed depth from the middle of its box, so the drop and curve
/// match in both densities; `class` sets how far right the arm reaches.
function Hook(props: { class: string }) {
  return (
    <span
      class={`absolute top-1/2 left-1/2 -ml-px h-feed-hook border-l-2 border-t-2 border-ink-faint rounded-tl-sm ${props.class}`}
    />
  );
}
