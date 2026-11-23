import { Show } from "solid-js";
import type { Subscription, User } from "../../lib/types/index.ts";
import { t } from "../../shared/i18n/index.ts";
import DisplayName from "../../features/message/DisplayName.tsx";

type Props = {
  chatterId: string;
  user: User | null;
  color: string | undefined;
  subscription: Subscription | null;
};

const distinctLogin = (user: User | null) =>
  user && user.login !== user.displayName.toLowerCase() ? user.login : null;

export default function UserCardIdentity(props: Props) {
  return (
    <div class="min-w-0 flex flex-col leading-tight">
      <span class="truncate min-w-0 text-card-name">
        <Show
          when={props.user}
          fallback={
            <span class="font-semibold text-ink">{props.chatterId}</span>
          }
        >
          {(user) => (
            <DisplayName
              login={user().login}
              displayName={user().displayName}
              color={props.color}
              userId={props.chatterId}
            />
          )}
        </Show>
      </span>
      <Show when={distinctLogin(props.user)}>
        {(login) => (
          <span class="truncate text-small text-ink-faint">@{login()}</span>
        )}
      </Show>
      <Show when={props.subscription}>
        {(sub) => (
          <span class="truncate text-small text-ink-soft">
            {t("USER_CARD_SUBSCRIBER_STATUS", {
              tier: sub().tier,
              gifter: sub().gifterName ?? "",
              gifted: String(sub().gifterName !== null),
            })}
          </span>
        )}
      </Show>
    </div>
  );
}
