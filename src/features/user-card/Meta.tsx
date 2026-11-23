import type { FollowStatus, User } from "../../lib/types/index.ts";
import { Calendar, Heart } from "lucide-solid";
import { type JSX, Show } from "solid-js";
import { createCopied } from "../../kit/createCopied.ts";
import { Time } from "../../shared/time.ts";
import { t } from "../../shared/i18n/index.ts";

type Props = {
  user: User | null;
  follow: FollowStatus;
};

const CHIP =
  "shrink-0 flex items-center gap-1.5 h-control-sm px-2.5 rounded-sm bg-media-scrim text-small tabular-nums whitespace-nowrap";

const day = (at: string) => new Time(at, "D").toString();

function followTip(follow: FollowStatus): string {
  switch (follow.kind) {
    case "since":
      return `${t("USER_CARD_FOLLOWING_SINCE_LABEL")}\n${new Time(follow.at, "F").toString()}`;
    case "none":
      return t("USER_CARD_NOT_FOLLOWING_STATUS");
    case "hidden":
      return t("USER_CARD_FOLLOW_HIDDEN_HINT");
    case "unknown":
      return t("USER_CARD_FOLLOW_UNKNOWN_STATUS");
  }
}

function DateChip(props: { at: string; tip: string; icon: JSX.Element }) {
  const { copied, copy } = createCopied();
  return (
    <button
      type="button"
      data-tip={props.tip}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => void copy(day(props.at))}
      class={`${CHIP} cursor-pointer pressable active:pressed ${
        copied() ? "text-positive" : "text-on-accent"
      }`}
    >
      {props.icon}
      {day(props.at)}
    </button>
  );
}

export default function Meta(props: Props) {
  const followedAt = () =>
    props.follow.kind === "since" ? props.follow.at : undefined;

  return (
    <div class="relative shrink-0 flex gap-1.5">
      <Show when={props.user?.createdAt}>
        {(createdAt) => (
          <DateChip
            at={createdAt()}
            tip={`${t("USER_CARD_ACCOUNT_CREATED_LABEL")}\n${new Time(createdAt(), "F").toString()}`}
            icon={<Calendar class="size-4" />}
          />
        )}
      </Show>
      <Show
        when={followedAt()}
        fallback={
          <span
            role="img"
            aria-label={followTip(props.follow)}
            data-tip={followTip(props.follow)}
            class={`${CHIP} text-on-accent cursor-default`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Heart
              class={`size-4 ${props.follow.kind === "unknown" ? "opacity-60" : ""}`}
            />
          </span>
        }
      >
        {(at) => (
          <DateChip
            at={at()}
            tip={followTip(props.follow)}
            icon={<Heart class="size-4" fill="currentColor" />}
          />
        )}
      </Show>
    </div>
  );
}
