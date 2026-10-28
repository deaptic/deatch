import { onCleanup, Show } from "solid-js";
import Suggestions from "../../suggestions/Suggestions.tsx";
import ChatterRow from "../../suggestions/ChatterRow.tsx";
import { chattersByChannel } from "../../../lib/stores/users.ts";
import { rankChatters } from "../../../lib/utils/rankChatters.ts";
import type { Chatter } from "../../../lib/types/index.ts";
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
    const bucket = chattersByChannel.get(props.broadcasterId);
    return bucket ? rankChatters(bucket.values(), q) : [];
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
          props.controller.registerKeyHandler("mention", api.handleKey);
          onCleanup(() => props.controller.unregisterKeyHandler("mention"));
        }}
      />
    </Show>
  );
}
