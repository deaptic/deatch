import { useContext } from "solid-js";
import { ImageScale } from "../../shared/solid/imageScale.ts";
import { emoteSrcset, emoteZoom } from "../emotes/index.ts";

export const INLINE_EMOTE =
  "inline-block h-feed-emote max-w-feed-emote-max -my-feed-emote-bleed w-auto object-contain align-middle mx-px";

export default function InlineEmote(props: { url: string; name: string }) {
  const scale = useContext(ImageScale);
  return (
    <img
      src={props.url}
      srcset={emoteSrcset(props.url, scale())}
      {...emoteZoom(props.url)}
      alt={props.name}
      data-tip={props.name}
      data-emote
      decoding="async"
      class={`${INLINE_EMOTE} cursor-pointer`}
    />
  );
}
