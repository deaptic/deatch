import { Show } from "solid-js";
import * as bans from "../../lib/services/bans.ts";
import type { BanChoice } from "../../lib/constants/timeouts.ts";
import { canModerate, user as currentUser } from "../../lib/stores/users.ts";
import BanChoiceStrip from "../ban-modal/BanChoiceStrip.tsx";

type Props = {
  chatterId: string;
  broadcasterId: string;
  /// After a ban or timeout lands, which clears the chatter's messages.
  onRemoved: () => void;
};

export default function UserCardModActions(props: Props) {
  const canModerateChatter = () =>
    currentUser()?.id !== props.chatterId && canModerate(props.broadcasterId);

  function apply(choice: BanChoice) {
    bans
      .apply(
        { broadcasterId: props.broadcasterId, userId: props.chatterId },
        choice,
      )
      .then(() => {
        if (choice !== "unban") props.onRemoved();
      })
      .catch(() => {});
  }

  return (
    <Show when={canModerateChatter()}>
      <div class="p-2.5 border-b border-line-soft shrink-0">
        <BanChoiceStrip onChange={apply} />
      </div>
    </Show>
  );
}
