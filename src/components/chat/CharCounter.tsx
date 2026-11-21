import Presence from "../ui/Presence.tsx";

const SHOW_WITHIN = 99;

type Props = {
  value: () => string;
  max: number;
};

export default function CharCounter(props: Props) {
  const remaining = () => props.max - props.value().length;
  return (
    <Presence when={remaining() <= SHOW_WITHIN}>
      {() => (
        <span
          class={`absolute right-7 translate-x-1/2 -bottom-2 px-1 bg-surface text-micro tabular-nums pointer-events-none enter-pop ${
            remaining() <= 0 ? "text-negative" : "text-ink-faint"
          }`}
        >
          {remaining()}
        </span>
      )}
    </Presence>
  );
}
