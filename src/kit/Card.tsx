import { type JSX, useContext } from "solid-js";
import { FilterQuery } from "./filterQuery.ts";

type Tone = "plain" | "tinted" | "edited" | "inset";

const TONES: Record<Tone, string> = {
  plain: "bg-surface",
  tinted: "bg-accent-soft",
  edited: "bg-surface border border-accent-line",
  inset: "bg-raised",
};

type Props = {
  tone?: Tone;
  selected?: boolean;
  children: JSX.Element;
};

export default function Card(props: Props) {
  const query = useContext(FilterQuery);
  return (
    <section
      class={`rounded-lg ${TONES[props.tone ?? "plain"]} ${
        props.selected ? "ring-2 ring-accent" : ""
      } ${query().trim() ? "not-has-data-match:hidden" : ""}`}
    >
      {props.children}
    </section>
  );
}
