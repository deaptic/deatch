import type { JSX } from "solid-js";

type Tone = "plain" | "accent" | "edited";

const RESTING_BORDER =
  "border-transparent [[data-theme=light]_&]:border-line-soft";

const TONES: Record<Tone, string> = {
  plain: `bg-surface ${RESTING_BORDER}`,
  accent: `bg-accent-soft ${RESTING_BORDER}`,
  edited: "bg-surface border-accent/40",
};

type Props = {
  tone?: Tone;
  children: JSX.Element;
};

export const CARD_FRAME = `rounded-lg border ${RESTING_BORDER}`;

export default function Card(props: Props) {
  return (
    <section class={`rounded-lg border ${TONES[props.tone ?? "plain"]}`}>
      {props.children}
    </section>
  );
}
