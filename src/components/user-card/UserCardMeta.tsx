import { Show } from "solid-js";
import type { User } from "../../commands/users";
import type { GetChannelFollowersResponse } from "../../commands/channels";
import CopyableField from "../../ui/CopyableField";
import Timestamp from "../../ui/Timestamp";
import AtIcon from "../../icons/AtIcon";
import CalendarIcon from "../../icons/CalendarIcon";
import HashIcon from "../../icons/HashIcon";
import HeartIcon from "../../icons/HeartIcon";

type Follower = GetChannelFollowersResponse["data"][number];

type Props = {
  chatterId: string;
  user: User | null;
  follower: Follower | null;
};

const ICON_CLASS = "w-3 h-3 shrink-0";

export default function UserCardMeta(props: Props) {
  return (
    <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs min-w-0">
      <Show when={props.user}>
        <CopyableField
          copy={props.user!.login}
          icon={<AtIcon class={ICON_CLASS} />}
        >
          {props.user!.login}
        </CopyableField>
      </Show>
      <CopyableField
        copy={props.chatterId}
        title="Click to copy ID"
        icon={<HashIcon class={ICON_CLASS} />}
      >
        {props.chatterId}
      </CopyableField>
      <Show when={props.user?.created_at}>
        <CopyableField
          copy={props.user!.created_at}
          icon={<CalendarIcon class={ICON_CLASS} />}
        >
          <Timestamp ts={props.user!.created_at} format="D" />
        </CopyableField>
      </Show>
      <Show
        when={props.follower}
        fallback={
          <CopyableField
            copy="Unknown"
            icon={<HeartIcon class={ICON_CLASS} />}
            title="Mod permission required to view follow status"
          >
            Unknown
          </CopyableField>
        }
      >
        <CopyableField
          copy={props.follower!.followed_at}
          icon={<HeartIcon class={ICON_CLASS} />}
        >
          <Timestamp ts={props.follower!.followed_at} format="D" />
        </CopyableField>
      </Show>
    </div>
  );
}
