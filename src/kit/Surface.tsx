import { type JSX, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

type Edge = "top" | "bottom" | "right";
type Tone = "surface" | "none";

const EDGES: Record<Edge, string> = {
  top: "border-t",
  bottom: "border-b",
  right: "border-r",
};

const TONES: Record<Tone, string> = {
  surface: "bg-surface",
  none: "",
};

type Props = JSX.HTMLAttributes<HTMLElement> & {
  as?: "div" | "header" | "footer" | "section" | "aside" | "nav";
  tone?: Tone;
  edge?: Edge;
  strong?: boolean;
  divided?: boolean;
};

export default function Surface(props: Props) {
  const [local, others] = splitProps(props, [
    "as",
    "tone",
    "edge",
    "strong",
    "divided",
    "class",
  ]);
  const line = () => (local.strong ? "border-line" : "border-line-soft");
  return (
    <Dynamic
      component={local.as ?? "div"}
      {...others}
      class={`${TONES[local.tone ?? "surface"]} ${
        local.edge ? `${EDGES[local.edge]} ${line()}` : ""
      } ${local.divided ? "divide-y divide-line-soft" : ""} ${local.class ?? ""}`}
    />
  );
}
