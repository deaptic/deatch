import { For } from "solid-js";
import type { Toast } from "./toasts.ts";
import ToasterItem from "./ToasterItem.tsx";

type Props = {
  toasts: () => Toast[];
  onDismiss: (id: number) => void;
};

export default function Toaster(props: Props) {
  return (
    <div
      aria-live="polite"
      class="flex flex-col gap-2 items-end pointer-events-none [&>*]:pointer-events-auto"
    >
      <For each={props.toasts()}>
        {(toast) => <ToasterItem toast={toast} onDismiss={props.onDismiss} />}
      </For>
    </div>
  );
}
