import type { JSX } from "solid-js";
import { createImageReveal } from "../shared/solid/createImageReveal.ts";

type ThumbnailShape = "portrait" | "video" | "square" | "native";
type ThumbnailFit = "inline" | "fill" | "bleed" | "lines" | "media";

const SHAPES: Record<ThumbnailShape, string> = {
  portrait: "aspect-3/4",
  video: "aspect-video",
  square: "aspect-square",
  native: "",
};

const FITS: Record<ThumbnailFit, string> = {
  inline: "h-control-xs shrink-0 rounded-xs",
  fill: "w-full rounded-md",
  bleed: "w-full",
  lines: "h-lines-3 shrink-0 rounded-xs",
  media: "h-media w-fit min-w-media-min max-w-full rounded-xs",
};

type Props = {
  src: string;
  alt?: string;
  tip?: string;
  shape: ThumbnailShape;
  fit: ThumbnailFit;
  interactive?: boolean;
  children?: JSX.Element;
};

export default function Thumbnail(props: Props) {
  const native = () => props.shape === "native";
  const reveal = createImageReveal(() => props.src);
  return (
    <div
      class={`relative overflow-hidden bg-raised ${SHAPES[props.shape]} ${
        FITS[props.fit]
      }`}
      data-tip={props.tip}
    >
      <img
        src={props.src}
        alt={props.alt ?? ""}
        loading="lazy"
        decoding="async"
        ref={reveal.mount}
        onLoad={reveal.load}
        class={`${
          native()
            ? "block h-full w-auto object-contain"
            : "absolute inset-0 size-full object-cover"
        } ${reveal.fade()} ${
          props.interactive ? "transition-opacity group-hover:opacity-80" : ""
        }`}
      />
      {props.children}
    </div>
  );
}
