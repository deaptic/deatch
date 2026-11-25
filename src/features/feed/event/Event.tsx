import { For, type JSX, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { FeedEvent, Fragment, Person } from "../types.ts";
import { type EmoteMap, type CheermoteMap } from "../../emotes/index.ts";
import { t, tRich } from "../../../shared/i18n/index.ts";
import {
  DisplayName,
  MessageText,
  TextWithMentions,
  NameList,
  type UserActions,
} from "../../message/index.ts";
import Timestamp from "../../../kit/Timestamp.tsx";
import FeedItem, { type ItemLayout } from "../ui/item/index.ts";
import Actions from "./Actions.tsx";
import * as details from "./details.ts";
import { lineOf } from "../entries/feedEvent.ts";
import Text from "../../../kit/Text.tsx";

export type EventOptions = UserActions & {
  emotes: EmoteMap;
  cheermotes: CheermoteMap;
  onEventContextMenu?: (x: number, y: number, item: FeedEvent) => void;
};

type Props = ItemLayout & EventOptions & { item: FeedEvent };

export default function Event(props: Props) {
  const item = props.item;
  const look = () => details.look(item);
  const icon = () => <Dynamic component={look().Icon} />;
  const comfortable = () => props.density === "comfortable";
  const author = () => details.author(item);
  const line = () => lineOf(item);

  const name = (who: Person | string) =>
    typeof who === "string" ? (
      <Text bold>{who}</Text>
    ) : (
      <DisplayName
        login={who.login}
        displayName={who.name}
        color={who.color}
        userId={who.id}
        onShowUserCard={props.onShowUserCard}
        onUserContextMenu={props.onUserContextMenu}
      />
    );

  const said = (words: Fragment[]) => (
    <MessageText
      fragments={words}
      emotes={props.emotes}
      cheermotes={props.cheermotes}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
    />
  );

  const mentions = (text: string) => (
    <TextWithMentions
      text={text}
      people={details.people(item)}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
    />
  );

  const recipients = () => (
    <NameList
      people={item.recipients ?? []}
      limit={details.RECIPIENTS_SHOWN}
      more={(count) => t("FEED_GIFT_RECIPIENTS_MORE_VALUE", { count })}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
    />
  );

  const extras = (): (() => JSX.Element)[] => {
    const words = line() ? item.message : undefined;
    const detail = item.detail;
    return [
      ...(words ? [() => said(words)] : []),
      ...(detail ? [() => mentions(detail)] : []),
      ...(item.recipients?.length
        ? [() => tRich("FEED_GIFT_RECIPIENTS_LINE", { names: recipients })]
        : []),
    ];
  };

  return (
    <FeedItem
      id={item.id}
      timestamp={item.timestamp}
      density={props.density}
      continued={props.continued}
      selected={props.selected}
      flush={props.flush}
      bare={props.bare}
      showTimestamp={props.showTimestamp}
      toneColor={look().color}
      tile={() => (
        <FeedItem.Tile color={look().color}>
          <span class="*:size-feed-icon grid">{icon()}</span>
        </FeedItem.Tile>
      )}
      overlay={() => (
        <Show when={item.clip || item.unban_request}>
          <Actions item={item} />
        </Show>
      )}
      onContextMenu={
        props.onEventContextMenu &&
        ((x, y) => props.onEventContextMenu?.(x, y, item))
      }
    >
      <Show when={comfortable()}>
        <FeedItem.Title>
          <Show
            when={author()}
            fallback={
              <Text bold color="var(--tone)">
                {t(look().title)}
              </Text>
            }
          >
            {(who) => (
              <>
                {name(who())}
                <Text size="relative" color="var(--tone)" class="ml-1.5">
                  {t(look().title)}
                </Text>
              </>
            )}
          </Show>
          <Show when={props.showTimestamp}>
            <Timestamp ts={item.timestamp} format="c" variant="inline" />
          </Show>
        </FeedItem.Title>
      </Show>
      <FeedItem.Content>
        <Show when={!comfortable()}>
          <span class="*:size-feed-icon inline-grid align-text-bottom mr-1.5 text-(--tone)">
            {icon()}
          </span>
          <Show when={author()}>
            {(who) => (
              <>
                {name(who())}
                <Show when={!line()}>
                  <Text tone="soft">:</Text>
                </Show>{" "}
              </>
            )}
          </Show>
        </Show>
        <Show
          when={line()}
          fallback={<Show when={item.message}>{(words) => said(words())}</Show>}
        >
          {mentions(line())}
        </Show>
        <Show when={!comfortable()}>
          <For each={extras()}>
            {(extra) => <Text tone="soft"> · {extra()}</Text>}
          </For>
        </Show>
      </FeedItem.Content>
      <Show when={comfortable()}>
        <FeedItem.Detail>
          <For each={extras()}>{(extra) => <div>{extra()}</div>}</For>
        </FeedItem.Detail>
      </Show>
    </FeedItem>
  );
}
