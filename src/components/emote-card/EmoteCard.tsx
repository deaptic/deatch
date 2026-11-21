import { Check, Copy, ExternalLink } from "lucide-solid";
import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import Popover, { OVERLAY_GAP } from "../ui/Popover.tsx";
import IconButton from "../ui/IconButton.tsx";
import { createCopied } from "../ui/createCopied.ts";
import * as browser from "../../lib/services/browser.ts";
import {
  bttvChannel,
  bttvGlobal,
  ffzChannel,
  ffzGlobal,
  globalEmotes,
  sevenTvChannel,
  sevenTvGlobal,
} from "../../lib/stores/emotes.ts";
import {
  emoteScope,
  emoteSource,
  type EmoteSource,
  PROVIDER_NAMES,
} from "../../lib/utils/emoteSource.ts";
import { zoomUrls } from "../../lib/utils/emoteZoom.ts";
import { t } from "../../lib/i18n/index.ts";
import Presence from "../ui/Presence.tsx";

type Opened = { url: string; name: string; x: number; y: number };

const urls = (lists: { url: string }[][]) =>
  new Set(lists.flatMap((list) => list.map((e) => e.url)));

function Details(props: { url: string; name: string; source: EmoteSource }) {
  const { copied, copy } = createCopied();
  const [src, setSrc] = createSignal(zoomUrls(props.url).large);
  const scope = createMemo(() =>
    emoteScope(props.source, props.url, {
      channelUrls: urls([sevenTvChannel(), bttvChannel(), ffzChannel()]),
      globalUrls: urls([sevenTvGlobal(), bttvGlobal(), ffzGlobal()]),
      twitchGlobalIds: new Set(globalEmotes().map((e) => e.id)),
    }),
  );
  const provider = () => PROVIDER_NAMES[props.source.provider];

  return (
    <div class="flex items-center gap-3 py-2 pl-2 pr-1.5">
      <div class="size-12 shrink-0 grid place-items-center">
        <img
          src={src()}
          alt={props.name}
          onError={() => setSrc(zoomUrls(props.url).fallback)}
          class="max-w-12 max-h-12 object-contain"
        />
      </div>
      <div class="min-w-0 flex-1 flex flex-col">
        <div class="flex items-center gap-2">
          <p class="min-w-0 flex-1 text-body font-semibold text-ink truncate">
            {props.name}
          </p>
          <div class="shrink-0 flex items-center">
            <Show when={props.source.page}>
              {(page) => (
                <IconButton
                  size="sm"
                  label={t("EMOTE_CARD_OPEN", { provider: provider() })}
                  onClick={() => browser.open(page())}
                >
                  <ExternalLink class="size-4" />
                </IconButton>
              )}
            </Show>
            <IconButton
              size="sm"
              label={
                copied() ? t("CLIPBOARD_COPIED") : t("EMOTE_CARD_COPY_NAME")
              }
              onClick={() => void copy(props.name)}
            >
              {copied() ? (
                <Check class="size-4 enter-swap" />
              ) : (
                <Copy class="size-4" />
              )}
            </IconButton>
          </div>
        </div>
        <p class="text-small text-ink-soft truncate">
          {provider()}
          <Show when={scope()}>
            {(s) =>
              ` · ${t(s() === "channel" ? "EMOTE_CARD_CHANNEL" : "EMOTE_CARD_GLOBAL")}`
            }
          </Show>
        </p>
      </div>
    </div>
  );
}

export default function EmoteCard() {
  const [opened, setOpened] = createSignal<Opened | null>(null);
  let anchor: HTMLElement | undefined;

  const onClick = (e: MouseEvent) => {
    const img = (e.target as Element).closest<HTMLImageElement>(
      "img[data-emote]",
    );
    if (!img || !emoteSource(img.src)) return;
    e.preventDefault();
    e.stopPropagation();
    if (opened() && anchor === img) return setOpened(null);
    anchor = img;
    const rect = img.getBoundingClientRect();
    setOpened({
      url: img.src,
      name: img.alt,
      x: rect.left,
      y: rect.bottom + OVERLAY_GAP,
    });
  };

  onMount(() => {
    document.addEventListener("click", onClick, true);
    onCleanup(() => document.removeEventListener("click", onClick, true));
  });

  return (
    <Presence when={opened()}>
      {(current) => (
        <Show when={current()} keyed>
          {(o) => (
            <Show when={emoteSource(o.url)}>
              {(source) => (
                <Popover
                  x={o.x}
                  y={o.y}
                  opener={() => anchor}
                  onClose={() => setOpened(null)}
                >
                  <Details url={o.url} name={o.name} source={source()} />
                </Popover>
              )}
            </Show>
          )}
        </Show>
      )}
    </Presence>
  );
}
