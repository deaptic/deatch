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

export default function Card(props: Props) {
  return (
    <section
      class={`rounded-lg border border-transparent [[data-theme=light]_&]:border-line-soft ${
        TONES[props.tone ?? "plain"]
      }`}
    >
      {props.children}
    </section>
  );
}
