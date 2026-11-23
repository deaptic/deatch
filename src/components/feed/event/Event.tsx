import { Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { FeedEvent } from "../../../lib/types/index.ts";
import type { EmoteMap } from "../../../lib/utils/emoteMap.ts";
import type { CheermoteMap } from "../../../lib/utils/cheermote.ts";
import { t, tRich } from "../../../shared/i18n/index.ts";
import MessageText from "../../../features/message/MessageText.tsx";
import TextWithMentions from "../../../features/message/TextWithMentions.tsx";
import NameList from "../../../features/message/NameList.tsx";
import Timestamp from "../../../kit/Timestamp.tsx";
import type { UserActions } from "../../../features/message/userLink.ts";
import FeedItem, { type ItemLayout } from "../item/index.ts";
import Actions from "./Actions.tsx";
import * as details from "./details.ts";

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
      <Show when={props.density === "comfortable"}>
        <FeedItem.Title>
          <span class="font-semibold text-(--tone)">{t(look().title)}</span>
          <Show when={props.showTimestamp}>
            <Timestamp ts={item.timestamp} format="c" variant="inline" />
          </Show>
        </FeedItem.Title>
      </Show>
      <FeedItem.Content>
        <Show when={props.density === "compact"}>
          <span class="*:size-feed-icon inline-grid align-text-bottom mr-1.5 text-(--tone)">
            {icon()}
          </span>
        </Show>
        <TextWithMentions
          text={item.system_message}
          people={details.people(item)}
          onShowUserCard={props.onShowUserCard}
          onUserContextMenu={props.onUserContextMenu}
        />
      </FeedItem.Content>
      <FeedItem.Detail>
        <Show when={item.message}>
          {(words) => (
            <div>
              <MessageText
                fragments={words()}
                emotes={props.emotes}
                cheermotes={props.cheermotes}
                onShowUserCard={props.onShowUserCard}
                onUserContextMenu={props.onUserContextMenu}
              />
            </div>
          )}
        </Show>
        <Show when={item.detail}>{(detail) => <div>{detail()}</div>}</Show>
        <Show when={item.recipients?.length ? item.recipients : undefined}>
          {(recipients) => (
            <div>
              {tRich("FEED_GIFT_RECIPIENTS_LINE", {
                names: () => (
                  <NameList
                    people={recipients()}
                    limit={details.RECIPIENTS_SHOWN}
                    more={(count) =>
                      t("FEED_GIFT_RECIPIENTS_MORE_VALUE", { count })
                    }
                    onShowUserCard={props.onShowUserCard}
                    onUserContextMenu={props.onUserContextMenu}
                  />
                ),
              })}
            </div>
          )}
        </Show>
      </FeedItem.Detail>
    </FeedItem>
  );
}
