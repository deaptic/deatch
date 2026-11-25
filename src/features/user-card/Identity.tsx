import { Show } from "solid-js";
import type { Subscription, User } from "../../shared/types/index.ts";
import { t } from "../../shared/i18n/index.ts";
import { DisplayName } from "../message/index.ts";
import Text from "../../kit/Text.tsx";

type Props = {
  chatterId: string;
  user: User | null;
  color: string | undefined;
  subscription: Subscription | null;
};

const distinctLogin = (user: User | null) =>
  user && user.login !== user.displayName.toLowerCase() ? user.login : null;

export default function Identity(props: Props) {
  return (
    <div class="min-w-0 flex flex-col leading-tight">
      <Text truncate size="lg" class="min-w-0">
        <Show
          when={props.user}
          fallback={
            <Text bold tone="primary">
              {props.chatterId}
            </Text>
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
      </Text>
      <Show when={distinctLogin(props.user)}>
        {(login) => (
          <Text truncate size="sm" tone="faint">
            @{login()}
          </Text>
        )}
      </Show>
      <Show when={props.subscription}>
        {(sub) => (
          <Text truncate size="sm" tone="soft">
            {t("USER_CARD_SUBSCRIBER_STATUS", {
              tier: sub().tier,
              gifter: sub().gifterName ?? "",
              gifted: String(sub().gifterName !== null),
            })}
          </Text>
        )}
      </Show>
    </div>
  );
}
