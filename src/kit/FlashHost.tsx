import { Show } from "solid-js";
import { current } from "./flash.ts";

export default function FlashHost() {
  return (
    <Show when={current()}>
      {(text) => (
        <div
          role="status"
          class="absolute top-3 right-4 z-20 material-thin text-ink text-base font-semibold px-3 py-1.5 rounded-md pointer-events-none"
        >
          {text()}
        </div>
      )}
    </Show>
  );
}
