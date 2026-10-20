import { ChevronDown } from "lucide-solid";
import { createSignal, type JSX, Show } from "solid-js";

type Props = {
  label: string;
  children: JSX.Element;
};

/// A card row that shows its contents only when opened: for settings most
/// people never need to change. Starts closed.
export default function Disclosure(props: Props) {
  const [open, setOpen] = createSignal(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={open()}
        onClick={() => setOpen(!open())}
        class="w-full h-11 flex items-center justify-between gap-3 px-5 border-t border-line-soft last:rounded-b-lg text-body font-semibold text-ink cursor-pointer transition-colors duration-snap hover:bg-raised"
      >
        {props.label}
        <ChevronDown
          class={`size-4 text-ink-soft transition-transform duration-quick ${
            open() ? "rotate-180" : ""
          }`}
        />
      </button>
      <Show when={open()}>{props.children}</Show>
    </>
  );
}
