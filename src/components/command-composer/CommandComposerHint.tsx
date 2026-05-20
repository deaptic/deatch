import { Show } from "solid-js";

type Props = {
  commandName: string;
  activeOptionName: string | undefined;
  body: string;
  errored: boolean;
};

export default function CommandComposerHint(props: Props) {
  return (
    <div
      class={`flex items-center gap-2 px-4 py-2 border-b border-border-muted ${
        props.errored ? "bg-danger/10" : "bg-primary/6"
      }`}
    >
      <span class="text-xs truncate min-w-0">
        <span class="text-text-muted">/{props.commandName}</span>
        <Show when={props.activeOptionName}>
          <span class="text-text-muted"> · </span>
          <span class={`font-semibold ${props.errored ? "text-danger" : "text-primary"}`}>
            {props.activeOptionName}
          </span>
        </Show>
        <Show when={props.body}>
          <span class={props.errored ? "text-danger" : "text-text-muted"}>
            {" — "}{props.body}
          </span>
        </Show>
      </span>
    </div>
  );
}
