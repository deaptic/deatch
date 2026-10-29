import { Show } from "solid-js";
import { resolvedTheme } from "../../lib/stores/theme.ts";
import { type CheermoteMap, cheermoteTier } from "../../lib/utils/cheermote.ts";
import { readableColor } from "../../lib/utils/color.ts";
import { formatLocale } from "../../lib/i18n/index.ts";
import { REDUCED_MOTION } from "../../lib/constants/accessibility.ts";
import { INLINE_EMOTE } from "./InlineEmote.tsx";

export default function Cheermote(props: {
  text: string;
  prefix: string;
  bits: number;
  cheermotes: CheermoteMap;
}) {
  const tier = () => cheermoteTier(props.cheermotes, props.prefix, props.bits);
  return (
    <Show when={tier()} fallback={props.text}>
      {(tier) => {
        const image = () =>
          resolvedTheme() === "dark" ? tier().dark : tier().light;
        return (
          <span class="whitespace-nowrap">
            <picture>
              <source media={REDUCED_MOTION} srcset={image().still} />
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
