import { Show, type JSX } from "solid-js";

type Props = {
  title?: string;
  children: JSX.Element;
};

export default function SettingsContentSection(props: Props) {
  return (
    <div class="flex flex-col gap-3">
      <Show when={props.title}>
        <h3 class="text-text-muted text-xs font-medium uppercase tracking-wider">{props.title}</h3>
      </Show>
      {props.children}
    </div>
  );
}
