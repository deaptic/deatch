import * as channels from "../channels/index.ts";
import { clearDraft } from "./drafts.ts";
import { clearSentMessages } from "./sentMessages.ts";

export function start(): () => void {
  return channels.onChannel({
    leave: (id) => {
      clearDraft(id);
      clearSentMessages(id);
    },
  });
}
