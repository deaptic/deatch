import { ChevronLeft } from "lucide-solid";
import { createResource, For, Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import { moderatedChannels, user } from "../../lib/stores/users.ts";
import { sendShoutout } from "../../lib/api/twitch/chat.ts";
import { getStreamsFromIds } from "../../lib/api/twitch/streams.ts";
import type { User, UserRef } from "../../lib/types/index.ts";

type Props = {
  target: User;
  onBack: () => void;
  onDone: () => void;
};

// Channels that may post the shoutout: the viewer's own plus any they mod.
export function shoutoutSources(target: User): UserRef[] {
  const self = user();
  const own: UserRef[] = self
    ? [{ id: self.id, login: self.login, displayName: self.displayName }]
    : [];
  return [...own, ...moderatedChannels()].filter((c) => c.id !== target.id);
}

// Twitch rejects a shoutout from an offline channel, so only live ones show.
async function liveSources(target: User): Promise<UserRef[]> {
  const sources = shoutoutSources(target);
  const streams = await getStreamsFromIds(
    { userIds: sources.map((c) => c.id) },
    { silent: true },
  );
  const live = new Set(streams.map((s) => s.user.id));
  return sources.filter((c) => live.has(c.id));
}

export default function ShoutoutSources(props: Props) {
  const [sources] = createResource(
    () => props.target,
    (target) =>
      liveSources(target).catch((e) => {
        console.warn("shoutout sources unavailable", e);
        return [];
      }),
  );
  return (
    <>
      <MenuItem
        label={t("MENU_SHOUTOUT_TO")}
        icon={<ChevronLeft />}
        onClick={props.onBack}
      />
      <MenuDivider />
      <Show
        when={!sources.loading}
        fallback={
          <MenuItem label={t("MENU_CHECKING")} disabled onClick={() => {}} />
        }
      >
        <For
          each={sources() ?? []}
          fallback={
            <MenuItem
              label={t("MENU_NO_LIVE_CHANNELS")}
              disabled
              onClick={() => {}}
            />
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
                props.onDone();
              }}
            />
          )}
        </For>
      </Show>
    </>
  );
}
