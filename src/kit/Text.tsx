import { type JSX, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

export type TextSize = "xs" | "sm" | "md" | "lg" | "xl" | "relative";

export type TextTone =
  | "primary"
  | "soft"
  | "faint"
  | "accent"
  | "positive"
  | "negative"
  | "caution"
  | "inverse";

type Clamp = 1 | 2 | 3;
type Wrap = "words" | "all" | "pre";
type Align = "left" | "center" | "right";

const SIZES: Record<TextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
  xl: "text-4xl",
  relative: "text-feed-meta",
};

const TONES: Record<TextTone, string> = {
  primary: "text-ink",
  soft: "text-ink-soft",
  faint: "text-ink-faint",
  accent: "text-accent-ink",
  positive: "text-positive",
  negative: "text-negative",
  caution: "text-caution",
  inverse: "text-on-accent",
};

const CLAMPS: Record<Clamp, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
};

const WRAPS: Record<Wrap, string> = {
  words: "wrap-break-word",
  all: "break-all",
  pre: "whitespace-pre-wrap wrap-break-word",
};

const ALIGNS: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

type Props = Omit<JSX.HTMLAttributes<HTMLElement>, "style"> & {
  as?: "span" | "p" | `h${1 | 2 | 3 | 4 | 5 | 6}`;
  size?: TextSize;
  tone?: TextTone;
  bold?: boolean;
  truncate?: boolean;
  clamp?: Clamp;
  wrap?: Wrap;
  align?: Align;
  tabular?: boolean;
  italic?: boolean;
  nowrap?: boolean;
  interactive?: boolean;
  color?: string;
};

export default function Text(props: Props) {
  const [local, others] = splitProps(props, [
    "as",
    "size",
    "tone",
    "bold",
    "truncate",
    "clamp",
    "wrap",
    "align",
    "tabular",
    "italic",
    "nowrap",
    "interactive",
    "color",
    "class",
  ]);
  const classes = () =>
    [
      local.size && SIZES[local.size],
      local.tone && TONES[local.tone],
      local.bold && "font-semibold",
      local.truncate && "truncate",
      local.clamp && CLAMPS[local.clamp],
      local.wrap && WRAPS[local.wrap],
      local.align && ALIGNS[local.align],
      local.tabular && "tabular-nums",
      local.italic && "italic",
      local.nowrap && "whitespace-nowrap",
      local.interactive &&
        "cursor-pointer transition-colors duration-snap hover:text-ink hover:underline",
      local.color && "text-(--text-color)",
      local.class,
    ]
      .filter(Boolean)
      .join(" ");
  return (
    <Dynamic
      component={local.as ?? "span"}
      {...others}
      class={classes()}
      style={local.color ? { "--text-color": local.color } : undefined}
    />
  );
}
