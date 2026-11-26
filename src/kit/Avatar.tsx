import { createEffect, createSignal, type JSX, on, Show } from "solid-js";
import { createImageReveal } from "../shared/solid/createImageReveal.ts";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "fill";
type Ring = "dashed" | "negative" | "accent";

type Props = {
  src?: string;
  zoom?: { src: string; fallback: string };
  alt?: string;
  size: AvatarSize;
  ring?: Ring;
  pulse?: string;
  dimmed?: boolean;
  square?: boolean;
  inherit?: boolean;
  overlay?: JSX.Element;
  children?: JSX.Element;
};

const SIZES: Record<AvatarSize, string> = {
  xs: "size-6 text-xs",
  sm: "size-8 text-sm",
  md: "size-10 text-base",
  lg: "size-16 text-2xl",
  xl: "size-20 text-2xl",
  fill: "size-full",
};

const RINGS: Record<Ring, string> = {
  dashed: "outline-2 outline-offset-2 outline-dashed outline-line",
  negative: "outline-2 outline-offset-2 outline-negative",
  accent: "outline-2 outline-offset-2 outline-accent",
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
      class={`relative shrink-0 inline-grid place-items-center font-semibold select-none transition duration-settle ${
        props.inherit ? "" : "bg-picture text-ink-soft"
      } ${shape()} ${SIZES[props.size]} ${props.ring ? RINGS[props.ring] : ""} ${
        props.dimmed ? "grayscale opacity-50" : ""
      }`}
    >
      <Show when={!failed() && props.src} fallback={initial()}>
        {(src) => (
          <img
            src={src()}
            data-zoom-src={props.zoom?.src}
            data-zoom-fallback={props.zoom?.fallback}
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
      <Show when={props.ring ? props.pulse : undefined} keyed>
        {(pulse) => (
          <span
            aria-hidden="true"
            data-pulse={pulse}
            class={`pointer-events-none absolute inset-0 animate-ripple ${shape()} ${props.ring ? RINGS[props.ring] : ""}`}
          />
        )}
      </Show>
      {props.overlay}
      {props.children}
    </span>
  );
}
