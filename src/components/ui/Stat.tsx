import { type JSX, Show } from "solid-js";
import { createCopyable } from "./copyable.ts";

type Tone = "plain" | "media";

const TONES: Record<Tone, { value: string; icon: string }> = {
  plain: { value: "text-ink-soft", icon: "text-ink-faint" },
  media: {
    value:
      "h-6 px-2 rounded-sm bg-media-scrim backdrop-blur-thin text-on-accent font-semibold",
    icon: "text-on-accent",
  },
};

type Props = {
  icon: JSX.Element;
  value: string;
  tone?: Tone;
  truncate?: boolean;
  copy?: string;
};

export default function Stat(props: Props) {
  const copyable = createCopyable("text-ink-soft");
  const tone = () => TONES[props.tone ?? "plain"];

  return (
    <Show when={props.value}>
      <span
        class={`flex items-center gap-1.5 tabular-nums whitespace-nowrap ${
          props.truncate ? "min-w-0" : "shrink-0"
        } ${props.copy ? copyable.class() : tone().value}`}
        data-tip={props.truncate ? props.value : undefined}
        {...(props.copy && copyable.handlers(() => props.copy ?? ""))}
      >
        <span class={`shrink-0 [&>svg]:size-3.5 ${tone().icon}`}>
          {props.icon}
        </span>
        <span class={props.truncate ? "truncate" : ""}>{props.value}</span>
      </span>
    </Show>
  );
}
