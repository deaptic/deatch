import { For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { formatCount } from "../../shared/format/stream.ts";
import Card from "../../kit/Card.tsx";
import CardTitle from "./CardTitle.tsx";
import Text from "../../kit/Text.tsx";
import {
  emoteSrcset,
  emoteUses,
  emoteZoom,
  mostUsed,
} from "../emotes/index.ts";
import { tileRows } from "./model.ts";

const HERO_SCALE = 2;
const SHOWN = 7;

type Emote = ReturnType<typeof mostUsed>[number];

const favouriteEmotes = () => mostUsed(emoteUses()).slice(0, SHOWN);

function SmallTile(props: { emote: Emote }) {
  return (
    <div class="flex-1 min-w-0 grid">
      <Card tone="inset">
        <div
          class="h-full flex flex-col items-center justify-center gap-1 py-2"
          data-tip={props.emote.label}
        >
          <img
            src={props.emote.url}
            srcset={emoteSrcset(props.emote.url)}
            {...emoteZoom(props.emote.url)}
            alt={props.emote.label}
            class="size-8 object-contain"
          />
          <Text size="xs" tone="soft" tabular>
            {formatCount(props.emote.count)}
          </Text>
        </div>
      </Card>
    </div>
  );
}

const EMPTY_ROWS = [3, 3];

function EmptyLayout() {
  return (
    <div class="flex-1 flex gap-1.5 px-4 pb-3">
      <div class="grid w-2/5">
        <Card tone="inset">
          <div class="h-full flex items-center justify-center p-3">
            <Text size="sm" tone="faint" align="center">
              {t("HOME_EMOTES_EMPTY")}
            </Text>
          </div>
        </Card>
      </div>
      <div class="flex-1 min-w-0 flex flex-col gap-1.5">
        <For each={EMPTY_ROWS}>
          {(length) => (
            <div class="flex-1 flex gap-1.5">
              <For each={Array.from({ length })}>
                {() => (
                  <div class="flex-1 grid">
                    <Card tone="inset">{null}</Card>
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

export default function EmotesCard() {
  const top = () => favouriteEmotes()[0];
  const rest = () => favouriteEmotes().slice(1);
  const rows = () => {
    let start = 0;
    return tileRows(rest().length).map((length) => {
      const row = rest().slice(start, start + length);
      start += length;
      return row;
    });
  };

  return (
    <Card>
      <div class="flex flex-col h-full">
        <CardTitle>{t("HOME_EMOTES_TITLE")}</CardTitle>
        <Show when={top()} fallback={<EmptyLayout />}>
          {(first) => (
            <div class="flex-1 flex gap-1.5 px-4 pb-3">
              <div class={`grid ${rest().length > 0 ? "w-2/5" : "flex-1"}`}>
                <Card tone="inset">
                  <div
                    class="h-full flex flex-col items-center justify-center gap-1 px-2 py-3"
                    data-tip={first().label}
                  >
                    <img
                      src={first().url}
                      srcset={emoteSrcset(first().url, HERO_SCALE)}
                      {...emoteZoom(first().url)}
                      alt={first().label}
                      class="size-14 object-contain"
                    />
                    <Text size="sm" bold tone="primary" truncate>
                      {first().label}
                    </Text>
                    <Text size="xs" tone="soft" tabular>
                      {formatCount(first().count)}
                    </Text>
                  </div>
                </Card>
              </div>
              <Show when={rest().length > 0}>
                <div class="flex-1 min-w-0 flex flex-col gap-1.5">
                  <For each={rows()}>
                    {(row) => (
                      <div class="flex-1 flex gap-1.5">
                        <For each={row}>
                          {(emote) => <SmallTile emote={emote} />}
                        </For>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          )}
        </Show>
      </div>
    </Card>
  );
}
