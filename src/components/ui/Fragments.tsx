import { For, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { EmoteMap } from "../../lib/stores/emotes.ts";
import { resolvedTheme } from "../../lib/stores/theme.ts";
import type { Fragment } from "../../lib/types/index.ts";
import { type CheermoteMap, cheermoteTier } from "../../lib/utils/cheermote.ts";
import { readableColor } from "../../lib/utils/color.ts";
import { emoteZoom } from "../../lib/utils/emoteZoom.ts";
import {
  onMiddleClick,
  preventAutoscroll,
} from "../../lib/utils/middleClick.ts";
import { textSegments } from "../../lib/utils/textSegments.ts";
import { emoteUrl } from "../../lib/utils/twitchUrl.ts";
import { formatLocale } from "../../lib/i18n/index.ts";
import Artwork from "./Artwork.tsx";
import { type UserActions, userLink, userLinkHover } from "./userLink.ts";

const INLINE_EMOTE =
  "inline-block h-feed-emote max-w-feed-emote-max -my-feed-emote-bleed w-auto object-contain align-middle mx-px";

type Props = UserActions & {
  fragments: Fragment[];
  emotes: EmoteMap;
  cheermotes: CheermoteMap;
  mentionsYou?: boolean;
};

/// Chat text as Twitch sends it: words, emotes, cheers, mentions and GIFs.
export default function Fragments(props: Props) {
  return (
    <For each={props.fragments}>
      {(frag) => <Piece frag={frag} {...props} />}
    </For>
  );
}

function Piece(props: Omit<Props, "fragments"> & { frag: Fragment }) {
  const frag = props.frag;
  switch (frag.type) {
    case "emote": {
      const url = emoteUrl(frag.id);
      return <InlineEmote url={url} name={frag.text} />;
    }
    case "cheermote":
      return (
        <Cheermote
          text={frag.text}
          prefix={frag.prefix}
          bits={frag.bits}
          cheermotes={props.cheermotes}
        />
      );
    case "gif":
      return (
        <span class="block my-1">
          <Artwork
            src={frag.url}
            alt={frag.text}
            tip={frag.text}
            shape="native"
            fit="feed"
          />
        </span>
      );
    case "mention":
      return (
        <span
          class={`${userLinkHover(props)} ${
            props.mentionsYou
              ? "text-accent-ink font-semibold"
              : "text-ink font-medium"
          }`}
          {...userLink(() => ({ login: frag.user_login }), props)}
        >
          {frag.text}
        </span>
      );
    default:
      return <TextWithEmotes text={frag.text} emotes={props.emotes} />;
  }
}

function InlineEmote(props: { url: string; name: string }) {
  return (
    <img
      src={props.url}
      {...emoteZoom(props.url)}
      alt={props.name}
      data-tip={props.name}
      decoding="async"
      class={INLINE_EMOTE}
    />
  );
}

function TextWithEmotes(props: { text: string; emotes: EmoteMap }) {
  return (
    <For each={textSegments(props.text, props.emotes)}>
      {(segment) =>
        segment.kind === "emote"
          ? <InlineEmote url={segment.url} name={segment.name} />
          : segment.kind === "link"
          ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                openUrl(segment.url);
              }}
              onAuxClick={onMiddleClick(() => openUrl(segment.url))}
              onMouseDown={preventAutoscroll}
              class="text-accent-ink hover:underline break-all"
            >
              {segment.url}
            </a>
          )
          : segment.text}
    </For>
  );
}

function Cheermote(
  props: {
    text: string;
    prefix: string;
    bits: number;
    cheermotes: CheermoteMap;
  },
) {
  const tier = () => cheermoteTier(props.cheermotes, props.prefix, props.bits);
  return (
    <Show when={tier()} fallback={props.text}>
      {(tier) => {
        const image = () =>
          resolvedTheme() === "dark" ? tier().dark : tier().light;
        return (
          <span class="whitespace-nowrap">
            <picture>
              <source
                media="(prefers-reduced-motion: reduce)"
                srcset={image().still}
              />
              <img
                src={image().animated}
                alt={props.text}
                data-tip={props.text}
                decoding="async"
                class={INLINE_EMOTE}
              />
            </picture>
            <span
              class="font-semibold text-(--bits)"
              style={{ "--bits": readableColor(tier().color, resolvedTheme()) }}
            >
              {props.bits.toLocaleString(formatLocale())}
            </span>
          </span>
        );
      }}
    </Show>
  );
}
