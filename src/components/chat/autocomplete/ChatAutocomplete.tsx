import { onMount } from "solid-js";
import { createChatAutocompleteController } from "./controller.ts";
import EmoteAutocomplete from "./EmoteAutocomplete.tsx";
import MentionAutocomplete from "./MentionAutocomplete.tsx";
import CommandAutocomplete from "./CommandAutocomplete.tsx";
import type { Command } from "../../command-composer/types.ts";

export type ChatAutocompleteHandle = {
  update: (value: string, cursor: number) => void;
  reset: () => void;
  handleKey: (e: KeyboardEvent) => boolean;
  isActive: () => boolean;
};

type Props = {
  broadcasterId: string;
  getValue: () => string;
  getCursor: () => number;
  setValue: (v: string) => void;
  focus: () => void;
  onCommandSelected: (cmd: Command) => void;
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
      reset: controller.reset,
      handleKey: controller.handleKey,
      isActive: controller.isActive,
    });
  });

  return (
    <>
      <CommandAutocomplete
        controller={controller}
        broadcasterId={props.broadcasterId}
        onCommandSelected={props.onCommandSelected}
      />
      <MentionAutocomplete
        controller={controller}
        broadcasterId={props.broadcasterId}
      />
      <EmoteAutocomplete controller={controller} />
    </>
  );
}
