import type { FollowStatus, User } from "../../lib/types/index.ts";
import { Calendar, Heart } from "lucide-solid";
import { Show } from "solid-js";
import UserCardDateCell from "./UserCardDateCell.tsx";
import Timestamp from "../ui/Timestamp.tsx";
import { t } from "../../lib/i18n/index.ts";

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
          <UserCardDateCell
            icon={<Calendar />}
            title={t("USER_CARD_ACCOUNT_CREATED")}
            copyable
          >
            <Timestamp ts={createdAt()} format="D" />
          </UserCardDateCell>
        )}
      </Show>
      <UserCardDateCell
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
      </UserCardDateCell>
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
