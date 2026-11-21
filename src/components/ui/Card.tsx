import { type JSX, useContext } from "solid-js";
import { SettingsQuery } from "./settingsQuery.ts";

type Tone = "plain" | "marked" | "edited" | "floating" | "floating-tint";

const RESTING_BORDER =
  "border-transparent [[data-theme=light]_&]:border-line-soft";

const TONES: Record<Tone, string> = {
  plain: `bg-surface ${RESTING_BORDER}`,
  marked:
    "bg-accent/10 border-transparent border-l-3 border-l-accent rounded-l-none",
  edited: "bg-surface border-accent/40",
  floating: "material-thin transition-colors duration-settle ease-out",
  "floating-tint": "material-tint transition-colors duration-settle ease-out",
};

type Props = {
  tone?: Tone;
  children: JSX.Element;
};

export const CARD_FRAME = `rounded-lg border ${RESTING_BORDER}`;

export default function Card(props: Props) {
  const query = useContext(SettingsQuery);
  return (
    <section
      class={`rounded-lg border ${TONES[props.tone ?? "plain"]} ${
        query().trim() ? "not-has-data-match:hidden" : ""
      }`}
    >
      {props.children}
    </section>
  );
}
