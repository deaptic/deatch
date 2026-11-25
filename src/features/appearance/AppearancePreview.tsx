import { t } from "../../shared/i18n/index.ts";
import { createMemo, createResource, For } from "solid-js";
import type { FeedEntry, FeedMessage, Fragment } from "../feed/index.ts";
import * as badges from "../badges/index.ts";
import {
  feedDensity,
  feedShowDeletedContent,
  feedShowTimestamp,
  feedShowAvatars,
} from "../preferences/index.ts";
import { users } from "../users/index.ts";
import { user } from "../users/index.ts";
import {
  feedEvent,
  FeedRow,
  groupsMessages,
  layoutFeed,
} from "../feed/index.ts";

type Me = { id: string; login: string; name: string; color: string };

const noop = () => {};

const text = (value: string): Fragment => ({ type: "text", text: value });
const VIP = { set_id: "vip", id: "1", info: "" };
const SUBSCRIBER = { set_id: "subscriber", id: "0", info: "" };

function sampleFeed(me: Me, now: number): FeedEntry[] {
  const at = (minutesAgo: number) => now - minutesAgo * 60_000;
  const message = (
    id: string,
    fragments: Fragment[],
    minutesAgo: number,
    extra: Partial<FeedMessage> = {},
  ): FeedMessage => ({
    kind: "message",
    message_id: id,
    chatter_user_id: me.id,
    chatter_login: me.login,
    chatter_name: me.name,
    color: me.color,
    fragments,
    badges: [VIP],
    timestamp: at(minutesAgo),
    ...extra,
  });
  return [
    message(
      "p1",
      [
        text(`${t("SETTINGS_MESSAGES_PREVIEW_CAT_LINE")} `),
        { type: "emote", text: "NotLikeThis", id: "58765" },
      ],
      12,
    ),
    message("p2", [text(t("SETTINGS_MESSAGES_PREVIEW_KEYBOARD_LINE"))], 11.5, {
      deleted: true,
    }),
    feedEvent("sub", t("FEED_SUB_LINE", { plan: "1" }), at(2), {
      id: "p3",
      chatter_user_id: me.id,
      chatter_login: me.login,
      chatter_name: me.name,
      color: me.color,
    }),
    message("p4", [text(t("SETTINGS_MESSAGES_PREVIEW_SUBBED_LINE"))], 1, {
      badges: [VIP, SUBSCRIBER],
    }),
  ];
}

export default function AppearancePreview() {
  const [color] = createResource(() => user()?.id, users.chatColor);
  const me = (): Me => {
    const u = user();
    return {
      id: u?.id ?? "preview",
      login: u?.login ?? "you",
      name: u?.displayName ?? t("SETTINGS_MESSAGES_PREVIEW_YOU_VALUE"),
      color: color() ?? "",
    };
  };
  const entries = createMemo(() =>
    color.loading ? [] : sampleFeed(me(), Date.now()),
  );
  const rows = createMemo(() =>
    layoutFeed(entries(), groupsMessages(feedDensity())),
  );
  const [badgeMap] = createResource(
    () => ({ own: user() }),
    ({ own }) =>
      own
        ? badges.badgeMapFor({ id: own.id, login: own.login })
        : badges.loadGlobal(),
    { initialValue: {} },
  );

  return (
    <div class="px-2 pb-3 pr-4 text-(length:--chat-size)">
      <For each={entries()}>
        {(entry, i) => (
          <FeedRow
            entry={entry}
            density={feedDensity()}
            continued={rows()[i()]?.continued}
            showTimestamp={feedShowTimestamp()}
            showAvatars={feedShowAvatars()}
            linkPreviews={false}
            showDeletedContent={feedShowDeletedContent()}
            flush
            emotes={{}}
            cheermotes={{}}
            badges={badgeMap()}
            userLogin={me().login}
            reactions={[]}
            onContextMenu={noop}
            onReply={noop}
            onReact={noop}
            onCopypasta={noop}
          />
        )}
      </For>
    </div>
  );
}
