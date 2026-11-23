import { createEffect, createSignal, type JSX, on, Show } from "solid-js";
import { avatarZoom } from "../lib/utils/avatar.ts";
import { createImageReveal } from "../shared/solid/createImageReveal.ts";
import { type MessageKey, t } from "../lib/i18n/index.ts";

type AvatarSize = 24 | 32 | 36 | 40 | 64 | 80 | "fill";
type Transition = "on-air" | "live" | "online" | "offline";

type Props = {
  src?: string;
  alt?: string;
  size: AvatarSize;
  presence?: Transition;
  dashed?: boolean;
  square?: boolean;
  overlay?: JSX.Element;
  children?: JSX.Element;
};

const PRESENCE: Record<
  Transition,
  { dot: string; label: MessageKey; breathes: boolean }
> = {
  "on-air": { dot: "bg-live", label: "UI_LIVE_STATUS", breathes: true },
  live: { dot: "bg-live", label: "UI_LIVE_STATUS", breathes: false },
  online: { dot: "bg-positive", label: "UI_ONLINE_STATUS", breathes: false },
  offline: { dot: "bg-ink-faint", label: "UI_OFFLINE_STATUS", breathes: false },
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

  return (
    <span
      class={`relative shrink-0 inline-grid place-items-center bg-picture font-semibold text-ink-soft select-none ${shape()} ${
        SIZES[props.size].box
      } ${
        props.dashed
          ? "outline-2 outline-dashed outline-offset-2 outline-line"
          : ""
      }`}
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
            class={`absolute inset-0 size-full object-cover ${shape()} ${reveal.fade()}`}
          />
        )}
      </Show>
      {props.overlay}
      <Show when={props.presence}>
        {(presence) => (
          <span
            data-tip={t(PRESENCE[presence()].label)}
            class={`absolute -bottom-px -right-px rounded-full ring-2 ring-surface ${
              PRESENCE[presence()].dot
            } ${SIZES[props.size].dot}`}
          >
            <Show when={PRESENCE[presence()].breathes}>
              <span
                aria-hidden
                class={`absolute inset-0 rounded-full animate-breathe ${PRESENCE[presence()].dot}`}
              />
            </Show>
          </span>
        )}
      </Show>
      {props.children}
    </span>
  );
}
