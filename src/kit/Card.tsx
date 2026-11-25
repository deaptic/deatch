import { type JSX, useContext } from "solid-js";
import { FilterQuery } from "./filterQuery.ts";

type Tone = "plain" | "marked" | "edited";

const TONES: Record<Tone, string> = {
  plain: "bg-surface",
  marked: "bg-accent-soft border-l-3 border-accent rounded-l-none",
  edited: "bg-surface border border-accent-line",
};

type Props = {
  tone?: Tone;
  children: JSX.Element;
};

export default function Card(props: Props) {
  const query = useContext(FilterQuery);
  return (
    <section
      class={`rounded-lg ${TONES[props.tone ?? "plain"]} ${
        query().trim() ? "not-has-data-match:hidden" : ""
      }`}
    >
      {props.children}
    </section>
  );
}
