import { createEffect, createMemo, For, on, Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import type { UserRef } from "../../../shared/types/index.ts";
import { ChatterPicture } from "../../message/index.ts";
import { groupsMessages, layoutFeed, Message } from "../../feed/index.ts";
import { typeableEmotes } from "../../emotes/index.ts";
import { knownChatterColor, user as self } from "../../users/index.ts";
import {
  feedDensity,
  feedLinkPreviews,
  feedShowAvatars,
  feedShowTimestamp,
} from "../../preferences/index.ts";
import Surface from "../../../kit/Surface.tsx";
import Text from "../../../kit/Text.tsx";
import WhisperComposer from "./WhisperComposer.tsx";
import { feedMessageOf, threadWith } from "./model.ts";
import * as whispers from "./store.ts";

export default function WhisperThread(props: { peer: UserRef }) {
  let thread: HTMLDivElement | undefined;

  const messages = createMemo(() =>
    threadWith(whispers.whispers(), props.peer.id).map((w) => {
      const sender = (w.outgoing ? self() : null) ?? w.peer;
      return feedMessageOf(w, sender, knownChatterColor(sender.id) ?? "");
    }),
  );
  const emoteMap = createMemo(() =>
    Object.fromEntries(
      Object.entries(typeableEmotes()).map(([name, e]) => [name, e.url]),
    ),
  );
  const rows = createMemo(() =>
    layoutFeed(messages(), groupsMessages(feedDensity())),
  );

  createEffect(
    on(
      () => messages().length,
      () => thread?.scrollTo({ top: thread.scrollHeight }),
    ),
  );

  return (
    <section class="flex-1 min-w-0 min-h-0 flex flex-col">
      <Surface as="header" tone="none" edge="bottom">
        <div class="flex items-center gap-2 px-4 py-2">
          <span class="min-h-control-sm min-w-0 flex items-center gap-2.5">
            <ChatterPicture
              size="xs"
              userId={props.peer.id}
              name={props.peer.displayName}
            />
            <Text size="md" bold tone="primary" truncate>
              {props.peer.displayName}
            </Text>
          </span>
        </div>
      </Surface>
      <div
        ref={thread}
        class="flex-1 min-h-0 overflow-y-auto pr-4 py-1 flex flex-col text-(length:--chat-size)"
      >
        <div class="px-4 py-2">
          <Text as="p" align="center" size="sm" tone="faint">
            {t("WHISPERS_LOCAL_ONLY_HINT")}
          </Text>
        </div>
        <For each={messages()}>
          {(item, i) => (
            <Message
              item={item}
              density={feedDensity()}
              continued={rows()[i()]?.continued}
              flush
              showTimestamp={feedShowTimestamp()}
              showAvatars={feedShowAvatars()}
              linkPreviews={feedLinkPreviews()}
              emotes={emoteMap()}
              cheermotes={{}}
              badges={{}}
              userLogin={self()?.login ?? ""}
              reactions={[]}
              showToolbar={false}
              highlightMentions={false}
            />
          )}
        </For>
      </div>
      <Show when={props.peer.id} keyed>
        <WhisperComposer
          placeholder={t("WHISPERS_MESSAGE_PLACEHOLDER", {
            name: props.peer.displayName,
          })}
          onSend={(text) => whispers.send(props.peer, text)}
        />
      </Show>
    </section>
  );
}
