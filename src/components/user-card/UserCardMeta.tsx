import type { User } from "../../lib/types/index.ts";
import { Calendar, Heart } from "lucide-solid";
import { type JSX, Show } from "solid-js";
import { createCopyable } from "../ui/copyable.ts";
import Timestamp from "../ui/Timestamp.tsx";
import { t } from "../../lib/i18n/index.ts";

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
    <div class="flex gap-card-pad text-card-meta min-w-0">
      <Show when={props.user?.createdAt}>
        {(createdAt) => (
          <DateCell
            icon={<Calendar />}
            title={t("USER_CARD_ACCOUNT_CREATED")}
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
          fallback={t(
            props.follow.kind === "none"
              ? "USER_CARD_NOT_FOLLOWING"
              : "USER_CARD_FOLLOW_UNKNOWN",
          )}
        >
          {(at) => <Timestamp ts={at()} format="D" />}
        </Show>
      </DateCell>
    </div>
  );
}

function followTitle(follow: FollowStatus): string {
  return t(
    follow.kind === "hidden"
      ? "USER_CARD_FOLLOW_HIDDEN"
      : "USER_CARD_FOLLOWING_SINCE",
  );
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
      data-tip={props.copyable ? copyable.tip(props.title) : props.title}
      disabled={!props.copyable}
      class={`flex-1 min-w-0 flex items-center gap-card-gap text-left [&>svg]:size-card-meta-icon [&>svg]:shrink-0 [&>svg]:text-ink-faint ${
        props.copyable ? copyable.class() : "text-ink-soft"
      }`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => copyable.copy(e.currentTarget.textContent)}
    >
      {props.icon}
      <span class="truncate">{props.children}</span>
    </button>
  );
}
