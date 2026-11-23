import { ChevronDown } from "lucide-solid";
import { createSignal, type JSX } from "solid-js";
import Transition from "./Transition.tsx";

type Props = {
  label: string;
  children: JSX.Element;
};

export default function Disclosure(props: Props) {
  const [open, setOpen] = createSignal(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={open()}
        onClick={() => setOpen(!open())}
        class="w-full h-11 flex items-center justify-between gap-3 px-5 last:rounded-b-lg text-body font-semibold text-ink cursor-pointer transition-colors duration-snap hover:bg-raised"
      >
        {props.label}
        <ChevronDown
          class={`size-4 text-ink-soft transition-transform duration-quick ${
            open() ? "rotate-180" : ""
          }`}
        />
      </button>
      <Transition when={open()}>
        {() => <div class="enter-expand">{props.children}</div>}
      </Transition>
    </>
  );
}
