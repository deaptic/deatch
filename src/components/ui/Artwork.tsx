import type { JSX } from "solid-js";

export type ArtworkShape = "boxart" | "video";
export type ArtworkFit = "inline" | "fill" | "bleed";

const SHAPES: Record<ArtworkShape, string> = {
  boxart: "aspect-3/4",
  video: "aspect-video",
};

const FITS: Record<ArtworkFit, string> = {
  inline: "h-7 shrink-0 rounded-xs",
  fill: "w-full rounded-md",
  bleed: "w-full",
};

type Props = {
  src: string;
  alt?: string;
  shape: ArtworkShape;
  fit: ArtworkFit;
  interactive?: boolean;
  children?: JSX.Element;
};

export default function Artwork(props: Props) {
  return (
    <div
      class={`relative overflow-hidden bg-raised ${SHAPES[props.shape]} ${
        FITS[props.fit]
      }`}
    >
      <img
        src={props.src}
        alt={props.alt ?? ""}
        loading="lazy"
        decoding="async"
        class={`absolute inset-0 size-full object-cover ${
          props.interactive
            ? "transition-opacity duration-snap group-hover:opacity-80"
            : ""
        }`}
      />
      {props.children}
    </div>
  );
}
