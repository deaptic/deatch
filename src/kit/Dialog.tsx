import { type JSX, Show } from "solid-js";
import Modal from "./Modal.tsx";

type Props = {
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit?: () => void;
  actions: JSX.Element;
  children?: JSX.Element;
};

export default function Dialog(props: Props) {
  return (
    <Modal variant="dialog" label={props.title} onClose={props.onClose}>
      <form
        class="contents"
        onSubmit={(e) => {
          e.preventDefault();
          props.onSubmit?.();
        }}
      >
        <div class="flex flex-col gap-1">
          <h2 class="text-base font-semibold text-ink">{props.title}</h2>
          <Show when={props.description}>
            <p class="text-base text-ink-soft">{props.description}</p>
          </Show>
        </div>
        {props.children}
        <div class="flex gap-2 justify-end pt-2">{props.actions}</div>
      </form>
    </Modal>
  );
}
