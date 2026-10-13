import type { User } from "../../lib/types/index.ts";
import { AtSign, Calendar, Hash, Heart } from "lucide-solid";
import { Show } from "solid-js";
import CopyableField from "./CopyableField.tsx";
import Timestamp from "../ui/Timestamp.tsx";

export type FollowStatus =
  | { kind: "unknown" }
  | { kind: "hidden" }
  | { kind: "none" }
  | { kind: "since"; at: string };

type Props = {
  chatterId: string;
  user: User | null;
  follow: FollowStatus;
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
      <FollowField follow={props.follow} />
    </div>
  );
}

function FollowField(props: { follow: FollowStatus }) {
  const since = () => props.follow.kind === "since" ? props.follow.at : null;
  const text = () => props.follow.kind === "none" ? "Not following" : "Unknown";
  return (
    <Show
      when={since()}
      fallback={
        <CopyableField
          copy={text()}
          icon={<Heart />}
          title={props.follow.kind === "hidden"
            ? "Mod permission required to view follow status"
            : undefined}
        >
          {text()}
        </CopyableField>
      }
    >
      {(at) => (
        <CopyableField copy={at()} icon={<Heart />}>
          <Timestamp ts={at()} format="D" />
        </CopyableField>
      )}
    </Show>
  );
}
