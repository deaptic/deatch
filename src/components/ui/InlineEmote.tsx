import { emoteZoom } from "../../lib/utils/emoteZoom.ts";

export const INLINE_EMOTE =
  "inline-block h-feed-emote max-w-feed-emote-max -my-feed-emote-bleed w-auto object-contain align-middle mx-px";

export default function InlineEmote(props: { url: string; name: string }) {
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
