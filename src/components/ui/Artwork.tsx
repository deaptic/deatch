import type { JSX } from "solid-js";
import { createImageReveal } from "../../lib/reactive/createImageReveal.ts";

type ArtworkShape = "boxart" | "video" | "native";
type ArtworkFit = "inline" | "fill" | "bleed" | "feed";

const SHAPES: Record<ArtworkShape, string> = {
  boxart: "aspect-3/4",
  video: "aspect-video",
  native: "",
};

const FITS: Record<ArtworkFit, string> = {
  inline: "h-7 shrink-0 rounded-xs",
  fill: "w-full rounded-md",
  bleed: "w-full",
  feed: "h-(--chat-gif) w-fit min-w-(--chat-tile) max-w-full rounded-xs",
};

type Props = {
  src: string;
  alt?: string;
  tip?: string;
  shape: ArtworkShape;
  fit: ArtworkFit;
  interactive?: boolean;
  children?: JSX.Element;
};

export default function Artwork(props: Props) {
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
