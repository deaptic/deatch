import { Show } from "solid-js";
import { current } from "./flash.ts";

export default function FlashHost() {
  return (
    <Show when={current()}>
      {(text) => (
        <div
          role="status"
          class="material-thin text-ink text-base font-semibold px-3 py-1.5 rounded-md pointer-events-none"
        >
          {text()}
        </div>
      )}
    </Show>
  );
}
