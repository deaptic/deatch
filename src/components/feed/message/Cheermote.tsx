import { Show } from "solid-js";
import { resolvedTheme } from "../../../lib/stores/theme.ts";
import { readableColor } from "../../../lib/utils/color.ts";
import {
  type CheermoteMap,
  cheermoteTier,
} from "../../../lib/utils/cheermote.ts";
import { INLINE_EMOTE } from "./inlineEmote.ts";

type Props = {
  text: string;
  prefix: string;
  bits: number;
  cheermotes: CheermoteMap;
};

export default function Cheermote(props: Props) {
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
              {props.bits.toLocaleString()}
            </span>
          </span>
        );
      }}
    </Show>
  );
}
