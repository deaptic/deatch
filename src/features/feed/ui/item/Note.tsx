import { For, type JSX, Show } from "solid-js";
import Toolbar from "../../../../kit/Toolbar.tsx";
import ToolbarItem, { type ToolbarTone } from "../../../../kit/ToolbarItem.tsx";
import Text from "../../../../kit/Text.tsx";

export type NoteAction = {
  title: string;
  icon: () => JSX.Element;
  onClick: () => void;
  tone?: ToolbarTone;
};

type Props = {
  label: string;
  class: string;
  suffix?: string;
  actions?: NoteAction[];
};

export default function Note(props: Props) {
  return (
    <>
      <div
        class={`text-feed-meta leading-tight font-semibold mb-0.5 ${props.class}`}
      >
        {props.label}
        <Show when={props.suffix}>
          <Text tone="soft" bold>{` · ${props.suffix}`}</Text>
        </Show>
      </div>
      <Show when={props.actions?.length}>
        <Toolbar alwaysVisible>
          <For each={props.actions}>
            {(action) => (
              <ToolbarItem
                title={action.title}
                tone={action.tone}
                onClick={action.onClick}
              >
                {action.icon()}
              </ToolbarItem>
            )}
          </For>
        </Toolbar>
      </Show>
    </>
  );
}
