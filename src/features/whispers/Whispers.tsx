import { ArrowLeft, MessageCircle } from "lucide-solid";
import { createEffect, createMemo, For, on, onMount, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import EmptyState from "../../kit/EmptyState.tsx";
import Avatar from "../../kit/Avatar.tsx";
import { avatarZoom } from "../../shared/avatar.ts";
import SearchPicker from "../../kit/SearchPicker.tsx";
import IconButton from "../../kit/IconButton.tsx";
import { channelSearch } from "../channels/index.ts";
import { ChatterPicture } from "../message/index.ts";
import { conversationsOf, feedMessageOf, threadWith } from "./model.ts";
import { groupsMessages, layoutFeed, Message } from "../feed/index.ts";
import { typeableEmotes } from "../emotes/index.ts";
import { knownChatterColor, user as self } from "../users/index.ts";
import { feedDensity, feedShowTimestamp } from "../preferences/index.ts";
import ConversationRow from "./ConversationRow.tsx";
import WhisperComposer from "./WhisperComposer.tsx";
import * as whispers from "./store.ts";
import SectionTitle from "../../kit/SectionTitle.tsx";
import Surface from "../../kit/Surface.tsx";
import Text from "../../kit/Text.tsx";

export default function Whispers() {
  let thread: HTMLDivElement | undefined;

  const conversations = () =>
    conversationsOf(whispers.whispers(), whispers.drafts());
  const messages = createMemo(() => {
    const peer = whispers.openPeer();
    if (!peer) return [];
    return threadWith(whispers.whispers(), peer.id).map((w) => {
      const sender = (w.outgoing ? self() : null) ?? w.peer;
      return feedMessageOf(w, sender, knownChatterColor(sender.id) ?? "");
    });
  });
  const emoteMap = createMemo(() =>
    Object.fromEntries(
      Object.entries(typeableEmotes()).map(([name, e]) => [name, e.url]),
    ),
  );
  const rows = createMemo(() =>
    layoutFeed(messages(), groupsMessages(feedDensity())),
  );

  onMount(() => {
    const peer = whispers.openPeer();
    if (peer) whispers.open(peer);
  });

  createEffect(
    on(
      () => messages().length,
      () => thread?.scrollTo({ top: thread.scrollHeight }),
    ),
  );

  return (
    <div class="@container flex-1 min-h-0 flex">
      <aside
        class="w-72 shrink-0 min-h-0 flex flex-col border-r border-line-soft @max-2xl:w-full @max-2xl:border-r-0"
        classList={{ "@max-2xl:hidden": !!whispers.openPeer() }}
      >
        <div class="p-3 flex flex-col gap-3">
          <SectionTitle>{t("WHISPERS_TITLE")}</SectionTitle>
          <SearchPicker
            floating
            clearOnSelect
            label={t("WHISPERS_NEW_PLACEHOLDER")}
            placeholder={t("WHISPERS_NEW_PLACEHOLDER")}
            search={(query) => channelSearch.find(query)}
            name={(c) => c.user.displayName}
            picture={(c) => (
              <Avatar
                src={c.profileImageUrl}
                zoom={avatarZoom(c.profileImageUrl)}
                alt={c.user.displayName}
                size="xs"
              />
            )}
            onSelect={(c) => {
              if (c) whispers.open(c.user);
            }}
          />
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5">
          <For
            each={conversations()}
            fallback={
              <div class="px-3 py-2">
                <Text as="p" size="sm" tone="faint">
                  {t("WHISPERS_EMPTY")}
                </Text>
              </div>
            }
          >
            {(c) => (
              <ConversationRow
                conversation={c}
                selected={whispers.openPeer()?.id === c.peer.id}
                onSelect={() => whispers.open(c.peer)}
                onDiscard={() => whispers.discard(c.peer.id)}
              />
            )}
          </For>
        </div>
      </aside>
      <Show
        when={whispers.openPeer()}
        fallback={
          <div class="flex-1 flex @max-2xl:hidden">
            <EmptyState
              icon={<MessageCircle />}
              title={t("WHISPERS_PICK_TITLE")}
              body={t("WHISPERS_PICK_DESCRIPTION")}
            />
          </div>
        }
      >
        {(peer) => (
          <section class="flex-1 min-w-0 min-h-0 flex flex-col">
            <Surface as="header" tone="none" edge="bottom">
              <div class="flex items-center gap-2 px-4 py-2">
                <span class="@2xl:hidden">
                  <IconButton
                    label={t("WHISPERS_BACK_LABEL")}
                    size="sm"
                    onClick={whispers.back}
                  >
                    <ArrowLeft class="size-4" />
                  </IconButton>
                </span>
                <span class="min-h-control-sm min-w-0 flex items-center gap-2.5">
                  <ChatterPicture
                    size="xs"
                    userId={peer().id}
                    name={peer().displayName}
                  />
                  <Text size="md" bold tone="primary" truncate>
                    {peer().displayName}
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
            <Show when={peer().id} keyed>
              <WhisperComposer
                placeholder={t("WHISPERS_MESSAGE_PLACEHOLDER", {
                  name: peer().displayName,
                })}
                onSend={(text) => whispers.send(peer(), text)}
              />
            </Show>
          </section>
        )}
      </Show>
    </div>
  );
}
