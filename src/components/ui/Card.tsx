import { type JSX, useContext } from "solid-js";
import { SettingsQuery } from "./settingsQuery.ts";

type Tone = "plain" | "marked" | "edited";

const TONES: Record<Tone, string> = {
  plain: "bg-surface",
  marked: "bg-accent/10 border-l-3 border-accent rounded-l-none",
  edited: "bg-surface border border-accent/40",
};

type Props = {
  tone?: Tone;
  children: JSX.Element;
};

export const CARD_FRAME = "rounded-lg";

export default function Card(props: Props) {
  const query = useContext(SettingsQuery);
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
