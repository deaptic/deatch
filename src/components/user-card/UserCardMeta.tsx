import type { User } from "../../lib/types/index.ts";
import { Calendar, Heart } from "lucide-solid";
import { type JSX, Show } from "solid-js";
import { createCopyable } from "../ui/copyable.ts";
import Timestamp from "../ui/Timestamp.tsx";

export type FollowStatus =
  | { kind: "unknown" }
  | { kind: "hidden" }
  | { kind: "none" }
  | { kind: "since"; at: string };

type Props = {
  user: User | null;
  follow: FollowStatus;
};

export default function UserCardMeta(props: Props) {
  const followedAt = () =>
    props.follow.kind === "since" ? props.follow.at : undefined;

  return (
    <div class="flex gap-(--card-pad) text-(length:--card-meta) min-w-0">
      <Show when={props.user?.createdAt}>
        {(createdAt) => (
          <DateCell
            icon={<Calendar />}
            title="Account created"
            copyable
          >
            <Timestamp ts={createdAt()} format="D" />
          </DateCell>
        )}
      </Show>
      <DateCell
        icon={<Heart />}
        title={followTitle(props.follow)}
        copyable={!!followedAt()}
      >
        <Show
          when={followedAt()}
          fallback={props.follow.kind === "none" ? "Not following" : "Unknown"}
        >
          {(at) => <Timestamp ts={at()} format="D" />}
        </Show>
      </DateCell>
    </div>
  );
}

function followTitle(follow: FollowStatus): string {
  return follow.kind === "hidden"
    ? "Mod permission required to view follow status"
    : "Following since";
}

function DateCell(props: {
  icon: JSX.Element;
  title: string;
  copyable: boolean;
  children: JSX.Element;
}) {
  const copyable = createCopyable("text-ink-soft");

  return (
    <button
      type="button"
      title={props.copyable ? copyable.title(props.title) : props.title}
      disabled={!props.copyable}
      class={`flex-1 min-w-0 flex items-center gap-(--card-gap) text-left [&>svg]:size-(--meta-icon) [&>svg]:shrink-0 [&>svg]:text-ink-faint ${
        props.copyable ? copyable.class() : "text-ink-soft"
      }`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => copyable.copy(e.currentTarget.textContent ?? "")}
    >
      {props.icon}
      <span class="truncate">{props.children}</span>
    </button>
  );
}
