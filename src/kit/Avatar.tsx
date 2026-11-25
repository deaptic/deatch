import { createEffect, createSignal, type JSX, on, Show } from "solid-js";
import { createImageReveal } from "../shared/solid/createImageReveal.ts";

export type AvatarSize = 24 | 32 | 36 | 40 | 64 | 80 | "fill";
type Ring = "dashed" | "negative";

type Props = {
  src?: string;
  zoom?: { src: string; fallback: string };
  alt?: string;
  size: AvatarSize;
  ring?: Ring;
  dimmed?: boolean;
  square?: boolean;
  inherit?: boolean;
  overlay?: JSX.Element;
  children?: JSX.Element;
};

const SIZES: Record<AvatarSize, string> = {
  24: "size-6 text-xs",
  32: "size-8 text-sm",
  36: "size-9 text-sm",
  40: "size-10 text-base",
  64: "size-16 text-2xl",
  80: "size-20 text-2xl",
  fill: "size-full",
};

const RINGS: Record<Ring, string> = {
  dashed: "outline-2 outline-offset-2 outline-dashed outline-line",
  negative: "outline-2 outline-offset-2 outline-negative",
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
      class={`relative shrink-0 inline-grid place-items-center font-semibold select-none ${
        props.inherit ? "" : "bg-picture text-ink-soft"
      } ${shape()} ${SIZES[props.size]} ${props.ring ? RINGS[props.ring] : ""}`}
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
            class={`absolute inset-0 size-full object-cover transition duration-settle ${shape()} ${reveal.fade()} ${
              props.dimmed ? "grayscale opacity-50" : ""
            }`}
          />
        )}
      </Show>
      {props.overlay}
      {props.children}
    </span>
  );
}
