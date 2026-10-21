import type { JSX } from "solid-js";

/// `native` keeps the picture's own proportions, for kinds that have none.
export type ArtworkShape = "boxart" | "video" | "native";
export type ArtworkFit = "inline" | "fill" | "bleed" | "feed";

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
        class={`${
          native()
            ? "block h-full w-auto object-contain"
            : "absolute inset-0 size-full object-cover"
        } ${
          props.interactive
            ? "transition-opacity duration-snap group-hover:opacity-80"
            : ""
        }`}
      />
      {props.children}
    </div>
  );
}
