import type { JSX } from "solid-js";

type Tone = "plain" | "accent";

const TONES: Record<Tone, string> = {
  plain: "bg-surface",
  accent: "bg-accent-soft",
};

type Props = {
  tone?: Tone;
  children: JSX.Element;
};

/// Also worn by things that act as a card but are not one, like a clickable
/// stream tile.
export const CARD_FRAME =
  "rounded-lg border border-transparent [[data-theme=light]_&]:border-line-soft";

export default function Card(props: Props) {
  return (
    <section class={`${CARD_FRAME} ${TONES[props.tone ?? "plain"]}`}>
      {props.children}
    </section>
  );
}
