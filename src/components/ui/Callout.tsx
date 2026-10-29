import type { JSX } from "solid-js";

type Tone = "negative";

const TONES: Record<Tone, string> = {
  negative: "bg-negative/10 border-negative",
};

export default function Callout(props: { tone: Tone; children: JSX.Element }) {
  return (
    <div
      class={`flex flex-col gap-0.5 px-3 py-2.5 rounded-sm border-l-3 text-small ${TONES[props.tone]}`}
    >
      {props.children}
    </div>
  );
}
