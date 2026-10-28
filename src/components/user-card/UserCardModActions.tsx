import { Show } from "solid-js";
import { banUser, unbanUser } from "../../lib/api/twitch/moderation.ts";
import { isModOfChannel, user as currentUser } from "../../lib/stores/users.ts";
import { moderationActionsDisabled } from "../../lib/stores/preferences.ts";
import BanChoiceStrip, {
  type BanChoice,
  secondsFor,
} from "../ban-modal/BanChoiceStrip.tsx";

type Props = {
  chatterId: string;
  broadcasterId: string;
  /** After a ban or timeout lands, which clears the chatter's messages. */
  onRemoved: () => void;
};

export default function UserCardModActions(props: Props) {
  const canModerate = () =>
    !moderationActionsDisabled() &&
    currentUser()?.id !== props.chatterId &&
    isModOfChannel(props.broadcasterId);

  function apply(choice: BanChoice) {
    const target = {
      broadcasterId: props.broadcasterId,
      userId: props.chatterId,
    };
    if (choice === "unban") {
      unbanUser(target).catch(() => {});
      return;
    }
    banUser({ ...target, duration: secondsFor(choice) })
      .then(props.onRemoved)
      .catch(() => {});
  }

  return (
    <Show when={canModerate()}>
      <div class="p-2.5 border-b border-line-soft shrink-0">
        <BanChoiceStrip onChange={apply} />
      </div>
    </Show>
  );
}
