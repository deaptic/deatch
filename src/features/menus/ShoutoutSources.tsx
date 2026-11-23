import { createResource, For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import MenuItem from "../../kit/MenuItem.tsx";
import { moderatedChannels } from "../permissions/index.ts";
import { user } from "../users/index.ts";
import { sendShoutout } from "../../platform/twitch/chat.ts";
import { getStreamsFromIds } from "../../platform/twitch/streams.ts";
import type { User, UserRef } from "../../shared/types/index.ts";

type Props = {
  target: User;
};

export function shoutoutSources(target: User): UserRef[] {
  const self = user();
  const own: UserRef[] = self
    ? [{ id: self.id, login: self.login, displayName: self.displayName }]
    : [];
  return [...own, ...moderatedChannels()].filter((c) => c.id !== target.id);
}

async function liveSources(target: User): Promise<UserRef[]> {
  const sources = shoutoutSources(target);
  const streams = await getStreamsFromIds(
    { userIds: sources.map((c) => c.id) },
    { silent: true },
  ).catch(() => []);
  const live = new Set(streams.map((s) => s.user.id));
  return sources.filter((c) => live.has(c.id));
}

export default function ShoutoutSources(props: Props) {
  const [sources] = createResource(
    () => props.target,
    (target) => liveSources(target),
  );
  return (
    <>
      <Show
        when={!sources.loading}
        fallback={<MenuItem label={t("MENU_CHECKING_STATUS")} disabled />}
      >
        <For
          each={sources() ?? []}
          fallback={
            <MenuItem label={t("MENU_NO_LIVE_CHANNELS_EMPTY")} disabled />
          }
        >
          {(from) => (
            <MenuItem
              label={from.displayName}
              onClick={() => {
                sendShoutout({
                  fromBroadcasterId: from.id,
                  toBroadcasterId: props.target.id,
                }).catch(() => {});
              }}
            />
          )}
        </For>
      </Show>
    </>
  );
}
