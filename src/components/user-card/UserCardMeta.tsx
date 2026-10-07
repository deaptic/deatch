import type { User } from "../../lib/types/index.ts";
import { AtSign, Calendar, Hash, Heart } from "lucide-solid";
import { Show } from "solid-js";
import CopyableField from "./CopyableField.tsx";
import Timestamp from "../ui/Timestamp.tsx";

type Props = {
  chatterId: string;
  user: User | null;
  followedAt: string | null;
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
        when={props.followedAt}
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
        {(followedAt) => (
          <CopyableField copy={followedAt()} icon={<Heart />}>
            <Timestamp ts={followedAt()} format="D" />
          </CopyableField>
        )}
      </Show>
    </div>
  );
}
