import { AtSign, Calendar, Hash, Heart } from "lucide-solid";
import { Show } from "solid-js";
import type { User } from "../../lib/api/twitch/users.ts";
import type { Follow } from "../../lib/api/twitch/channels.ts";
import CopyableField from "./CopyableField.tsx";
import Timestamp from "../ui/Timestamp.tsx";

type Props = {
  chatterId: string;
  user: User | null;
  follower: Follow | null;
};

export default function UserCardMeta(props: Props) {
  return (
    <div class="grid grid-meta gap-x-5 gap-y-2 text-small min-w-0">
      <Show when={props.user} fallback={<span />}>
        <CopyableField copy={props.user!.login} icon={<AtSign />} truncate>
          {props.user!.login}
        </CopyableField>
      </Show>
      <CopyableField
        copy={props.chatterId}
        title="Click to copy ID"
        icon={<Hash />}
      >
        {props.chatterId}
      </CopyableField>
      <Show when={props.user?.createdAt} fallback={<span />}>
        <CopyableField copy={props.user!.createdAt} icon={<Calendar />}>
          <Timestamp ts={props.user!.createdAt} format="D" />
        </CopyableField>
      </Show>
      <Show
        when={props.follower}
        fallback={
          <CopyableField
            copy="Unknown"
            icon={<Heart />}
            title="Mod permission required to view follow status"
          >
            Unknown
          </CopyableField>
        }
      >
        <CopyableField copy={props.follower!.followedAt} icon={<Heart />}>
          <Timestamp ts={props.follower!.followedAt} format="D" />
        </CopyableField>
      </Show>
    </div>
  );
}
