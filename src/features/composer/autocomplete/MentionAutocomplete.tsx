import { onCleanup, Show } from "solid-js";
import Suggestions from "../../../kit/Suggestions.tsx";
import { ChatterRow } from "../../message/index.ts";
import { chattersIn } from "../../users/index.ts";
import { rankChatters } from "../../users/index.ts";
import type { Chatter } from "../../users/index.ts";
import type { ChatAutocompleteController } from "./controller.ts";
import { TRIGGERS } from "./detect.ts";

type Props = {
  controller: ChatAutocompleteController;
  broadcasterId: string;
};

export default function MentionAutocomplete(props: Props) {
  const suggestions = (): Chatter[] => {
    const q = props.controller.queryFor("mention");
    if (q === null) return [];
    return rankChatters(chattersIn(props.broadcasterId), q);
  };

  function select(s: Chatter) {
    props.controller.clearAndSplice(
      TRIGGERS.mention,
      (m) => (m.startsWith("@") ? "" : m[0]) + "@" + s.login + " ",
    );
  }

  return (
    <Show when={suggestions().length > 0}>
      <Suggestions<Chatter>
        suggestions={suggestions}
        onSelect={select}
        onDismiss={props.controller.dismiss}
        renderItem={(s) => <ChatterRow chatter={s} />}
        ref={(api) => {
          props.controller.register("mention", api);
          onCleanup(() => props.controller.unregister("mention"));
        }}
      />
    </Show>
  );
}
