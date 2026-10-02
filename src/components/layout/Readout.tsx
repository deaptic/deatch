import { Show } from "solid-js";
import { readout } from "../../lib/stores/readout.ts";

export default function Readout() {
  return (
    <Show when={readout()}>
      {(text) => (
        <div
          role="status"
          class="absolute top-3 right-4 z-20 bg-overlay border border-line text-ink text-title px-3 py-1.5 rounded-md pointer-events-none"
        >
          {text()}
        </div>
      )}
    </Show>
  );
}
