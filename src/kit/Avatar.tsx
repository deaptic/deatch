import { Radio } from "lucide-solid";
import { createEffect, createSignal, type JSX, on, Show } from "solid-js";
import { avatarZoom } from "../shared/avatar.ts";
import { createImageReveal } from "../shared/solid/createImageReveal.ts";
import { type MessageKey, t } from "../shared/i18n/index.ts";

export type AvatarSize = 24 | 32 | 36 | 40 | 64 | 80 | "fill";
type Presence = "live" | "offline";
type PresenceLook = "dot" | "icon";

type Props = {
  src?: string;
  alt?: string;
  size: AvatarSize;
  presence?: Presence;
  presenceLook?: PresenceLook;
  dashed?: boolean;
  liveRing?: boolean;
  dimmed?: boolean;
  square?: boolean;
  inherit?: boolean;
  overlay?: JSX.Element;
  children?: JSX.Element;
};

const PRESENCE: Record<
  Presence,
  { dot: string; icon: string; label: MessageKey }
> = {
  live: { dot: "bg-live", icon: "text-live", label: "UI_LIVE_STATUS" },
  offline: {
    dot: "bg-ink-faint",
    icon: "text-ink-faint",
    label: "UI_OFFLINE_STATUS",
  },
};

const SIZES: Record<AvatarSize, { box: string; dot: string }> = {
  24: { box: "size-6 text-micro", dot: "size-1.5" },
  32: { box: "size-8 text-small", dot: "size-2" },
  36: { box: "size-9 text-small", dot: "size-2.5" },
  40: { box: "size-10 text-body", dot: "size-2.5" },
  64: { box: "size-16 text-heading", dot: "size-3" },
  80: { box: "size-20 text-heading", dot: "size-4" },
  fill: { box: "size-full", dot: "size-2" },
};

export default function Avatar(props: Props) {
  const [failed, setFailed] = createSignal(false);
  const initial = () => (props.alt?.trim()[0] ?? "?").toUpperCase();
  const shape = () => (props.square ? "rounded-xs" : "rounded-full");
  const reveal = createImageReveal(() => props.src);

  createEffect(
    on(
      () => props.src,
      () => setFailed(false),
    ),
  );

  const outline = () => {
    if (!props.liveRing && !props.dashed) return "";
    const style = props.dashed ? "outline-dashed" : "";
    const color = props.liveRing ? "outline-live" : "outline-line";
    return `outline-2 outline-offset-2 ${style} ${color}`;
  };

  return (
    <span
      class={`relative shrink-0 inline-grid place-items-center font-semibold select-none ${
        props.inherit ? "" : "bg-picture text-ink-soft"
      } ${shape()} ${SIZES[props.size].box} ${outline()}`}
    >
      <Show when={!failed() && props.src} fallback={initial()}>
        {(src) => (
          <img
            src={src()}
            {...avatarZoom(src())}
            alt={props.alt ?? ""}
            loading="lazy"
            decoding="async"
            ref={reveal.mount}
            onLoad={reveal.load}
            onError={() => setFailed(true)}
            class={`absolute inset-0 size-full object-cover transition duration-settle ${shape()} ${reveal.fade()} ${
              props.dimmed ? "grayscale opacity-50" : ""
            }`}
          />
        )}
      </Show>
      {props.overlay}
      <Show when={props.presence}>
        {(presence) => (
          <Show
            when={props.presenceLook === "icon"}
            fallback={
              <span
                data-tip={t(PRESENCE[presence()].label)}
                class={`absolute -bottom-px -right-px rounded-full ring-2 ring-surface ${
                  PRESENCE[presence()].dot
                } ${SIZES[props.size].dot}`}
              />
            }
          >
            <span
              data-tip={t(PRESENCE[presence()].label)}
              class={`absolute -bottom-0.5 -right-0.5 size-5 rounded-full ring-2 ring-surface bg-surface grid place-items-center ${
                PRESENCE[presence()].icon
              }`}
            >
              <Show when={presence() === "live"}>
                <span
                  aria-hidden
                  class="absolute size-2 rounded-full bg-live animate-breathe"
                />
              </Show>
              <Radio class="relative size-3.5" />
            </span>
          </Show>
        )}
      </Show>
      {props.children}
    </span>
  );
}
