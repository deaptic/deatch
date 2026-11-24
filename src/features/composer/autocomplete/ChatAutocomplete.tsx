import { onMount, Show } from "solid-js";
import { createChatAutocompleteController } from "./controller.ts";
import EmoteAutocomplete from "./EmoteAutocomplete.tsx";
import MentionAutocomplete from "./MentionAutocomplete.tsx";
import CommandAutocomplete from "./CommandAutocomplete.tsx";
import { type Command } from "../../commands/index.ts";
import type { ListboxField } from "../../../shared/solid/createListbox.ts";

export type ChatAutocompleteHandle = {
  update: (value: string, cursor: number) => void;
  handleKey: (e: KeyboardEvent) => boolean;
  isActive: () => boolean;
  field: ListboxField;
};

type Channel = {
  broadcasterId: string;
  onCommandSelected: (cmd: Command) => void;
};

type Props = {
  channel?: Channel;
  getValue: () => string;
  getCursor: () => number;
  setValue: (v: string) => void;
  focus: () => void;
  ref?: (h: ChatAutocompleteHandle) => void;
};

export default function ChatAutocomplete(props: Props) {
  const controller = createChatAutocompleteController({
    getValue: props.getValue,
    getCursor: props.getCursor,
    setValue: props.setValue,
    focus: props.focus,
  });

  onMount(() => {
    props.ref?.({
      update: controller.update,
      handleKey: controller.handleKey,
      isActive: controller.isActive,
      field: controller.field,
    });
  });

  return (
    <>
      <Show when={props.channel}>
        {(channel) => (
          <>
            <CommandAutocomplete
              controller={controller}
              broadcasterId={channel().broadcasterId}
              onCommandSelected={channel().onCommandSelected}
            />
            <MentionAutocomplete
              controller={controller}
              broadcasterId={channel().broadcasterId}
            />
          </>
        )}
      </Show>
      <EmoteAutocomplete controller={controller} />
    </>
  );
}
