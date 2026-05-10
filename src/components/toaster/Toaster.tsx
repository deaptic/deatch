import { For } from "solid-js";
import type { Toast } from "../../state/toasts";
import ToasterItem from "./ToasterItem";

type Props = {
  toasts: () => Toast[];
  onDismiss: (id: number) => void;
};

export default function Toaster(props: Props) {
  return (
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      <For each={props.toasts()}>
        {(toast) => <ToasterItem toast={toast} onDismiss={props.onDismiss} />}
      </For>
    </div>
  );
}
