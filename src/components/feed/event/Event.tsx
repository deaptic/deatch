import { Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { FeedEvent } from "../../../lib/types/index.ts";
import type { EmoteMap } from "../../../lib/utils/emoteMap.ts";
import type { CheermoteMap } from "../../../lib/utils/cheermote.ts";
import { t, tRich } from "../../../lib/i18n/index.ts";
import Fragments from "../../ui/Fragments.tsx";
import NamedText from "../../ui/NamedText.tsx";
import NameList from "../../ui/NameList.tsx";
import Timestamp from "../../ui/Timestamp.tsx";
import type { UserActions } from "../../ui/userLink.ts";
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
      tone="event"
      toneColor={look().color}
      tile={() => (
        <FeedItem.Tile color={look().color}>
          <span class="*:size-feed-icon grid">{icon()}</span>
        </FeedItem.Tile>
      )}
      overlay={() => (
        <Show when={item.clip}>{(clip) => <Actions clipId={clip().id} />}</Show>
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
        <NamedText
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
              <Fragments
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
              {tRich("EVENT_GIFTED_TO", {
                names: () => (
                  <NameList
                    people={recipients()}
                    limit={details.RECIPIENTS_SHOWN}
                    more={(count) => t("EVENT_GIFT_MORE", { count })}
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
