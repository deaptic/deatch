import { Show } from "solid-js";
import * as bans from "./bans.ts";
import type { BanChoice } from "../../lib/constants/timeouts.ts";
import { user as currentUser } from "../users/index.ts";
import { showsControls } from "../permissions/index.ts";
import BanChoiceStrip from "./BanChoiceStrip.tsx";

type Props = {
  chatterId: string;
  broadcasterId: string;
  onRemoved: () => void;
};

export default function ModActions(props: Props) {
  const canModerateChatter = () =>
    currentUser()?.id !== props.chatterId &&
    showsControls(props.broadcasterId, "moderate");

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
      <div class="p-2.5 shrink-0 contain-inline-size">
        <BanChoiceStrip onChange={apply} />
      </div>
    </Show>
  );
}
