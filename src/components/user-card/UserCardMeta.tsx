import { AtSign, Calendar, Hash, Heart } from "lucide-solid";
import { Show } from "solid-js";
import type { User } from "../../lib/api/twitch/users";
import type { Follow } from "../../lib/api/twitch/channels";
import CopyableField from "../ui/CopyableField";
import Timestamp from "../ui/Timestamp";

type Follower = Follow;

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
          icon={<AtSign class={ICON_CLASS} />}
        >
          {props.user!.login}
        </CopyableField>
      </Show>
      <CopyableField
        copy={props.chatterId}
        title="Click to copy ID"
        icon={<Hash class={ICON_CLASS} />}
      >
        {props.chatterId}
      </CopyableField>
      <Show when={props.user?.createdAt}>
        <CopyableField
          copy={props.user!.createdAt}
          icon={<Calendar class={ICON_CLASS} />}
        >
          <Timestamp ts={props.user!.createdAt} format="D" />
        </CopyableField>
      </Show>
      <Show
        when={props.follower}
        fallback={
          <CopyableField
            copy="Unknown"
            icon={<Heart class={ICON_CLASS} />}
            title="Mod permission required to view follow status"
          >
            Unknown
          </CopyableField>
        }
      >
        <CopyableField
          copy={props.follower!.followedAt}
          icon={<Heart class={ICON_CLASS} />}
        >
          <Timestamp ts={props.follower!.followedAt} format="D" />
        </CopyableField>
      </Show>
    </div>
  );
}
