import { t } from "../../shared/i18n/index.ts";
import { createMemo, createResource, For } from "solid-js";
import type { FeedEntry, FeedMessage } from "../../lib/types/index.ts";
import * as badges from "../badges/index.ts";
import {
  feedDensity,
  feedShowDeletedContent,
  feedShowTimestamp,
} from "../../lib/stores/preferences.ts";
import * as users from "../../lib/services/users.ts";
import { user } from "../../lib/stores/users.ts";
import { feedEvent, layoutFeed, FeedRow } from "../feed/index.ts";

type Me = { id: string; login: string; name: string; color: string };

const noop = () => {};

function sampleFeed(me: Me, now: number): FeedEntry[] {
  const at = (minutesAgo: number) => now - minutesAgo * 60_000;
  const message = (
    id: string,
    text: string,
    minutesAgo: number,
    extra: Partial<FeedMessage> = {},
  ): FeedMessage => ({
    kind: "message",
    message_id: id,
    chatter_user_id: me.id,
    chatter_login: me.login,
    chatter_name: me.name,
    color: me.color,
    fragments: [{ type: "text", text }],
    badges: [{ set_id: "broadcaster", id: "1", info: "" }],
    timestamp: at(minutesAgo),
    ...extra,
  });
  return [
    message("p1", t("SETTINGS_APPEARANCE_PREVIEW_WELCOME_LINE"), 12),
    message("p2", t("SETTINGS_APPEARANCE_PREVIEW_START_LINE"), 11.5),
    message("p3", t("SETTINGS_APPEARANCE_PREVIEW_WRONG_TAB_LINE"), 11, {
      deleted: true,
    }),
    message("p4", t("SETTINGS_APPEARANCE_PREVIEW_THANKS_LINE"), 1),
    feedEvent(
      "sub",
      t("SETTINGS_APPEARANCE_PREVIEW_SUB_LINE", { name: me.name }),
      at(0.5),
      {
        id: "p5",
        chatter_name: me.name,
      },
    ),
  ];
}

export default function AppearancePreview() {
  const [color] = createResource(() => user()?.id, users.chatColor);
  const me = (): Me => {
    const u = user();
    return {
      id: u?.id ?? "preview",
      login: u?.login ?? "you",
      name: u?.displayName ?? t("SETTINGS_APPEARANCE_PREVIEW_YOU_VALUE"),
      color: color() ?? "",
    };
  };
  const entries = createMemo(() =>
    color.loading ? [] : sampleFeed(me(), Date.now()),
  );
  const rows = createMemo(() =>
    layoutFeed(entries(), feedDensity() === "comfortable"),
  );
  const [badgeMap] = createResource(badges.loadGlobal, { initialValue: {} });

  return (
    <div class="px-2 pb-3 pr-4 text-(length:--chat-size)">
      <For each={entries()}>
        {(entry, i) => (
          <FeedRow
            entry={entry}
            density={feedDensity()}
            continued={rows()[i()]?.continued}
            showTimestamp={feedShowTimestamp()}
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
