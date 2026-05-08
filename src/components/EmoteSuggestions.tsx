import { For, onMount, createSignal, createEffect } from "solid-js";

type Suggestion = { name: string; url: string };

type Props = {
  suggestions: () => Suggestion[];
  onSelect: (name: string) => void;
  expose?: (api: { handleKey: (e: KeyboardEvent) => boolean }) => void;
};

export default function EmoteSuggestions(props: Props) {
  const [acIndex, setAcIndex] = createSignal(0);
  let containerRef: HTMLDivElement | undefined;

  createEffect(() => {
    props.suggestions();
    setAcIndex(0);
  });

  createEffect(() => {
    const item = containerRef?.children[acIndex()] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  });

  onMount(() => {
    props.expose?.({
      handleKey: (e) => {
        const suggestions = props.suggestions();
        if (suggestions.length === 0) return false;
        if (e.key === "ArrowDown") { e.preventDefault(); setAcIndex((i) => Math.min(i + 1, suggestions.length - 1)); return true; }
        if (e.key === "ArrowUp")   { e.preventDefault(); setAcIndex((i) => Math.max(i - 1, 0)); return true; }
        if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) { e.preventDefault(); props.onSelect(suggestions[acIndex()].name); return true; }
        if (e.key === "Escape")    { e.preventDefault(); props.onSelect(""); return true; }
        return false;
      },
    });
  });

  return (
    <div ref={containerRef} class="absolute bottom-full left-0 right-0 z-30 bg-[#1f1f23] border border-[#2d2d35] rounded-t-lg shadow-2xl overflow-y-auto max-h-60">
      <For each={props.suggestions()}>
        {(s, i) => (
          <button
            onClick={() => props.onSelect(s.name)}
            class={`w-full flex items-center gap-3 px-3 py-1.5 text-sm cursor-pointer transition-colors ${
              i() === acIndex() ? "bg-[#9146ff33]" : "hover:bg-[#2d2d35]"
            }`}
          >
            <img src={s.url} alt={s.name} class="w-6 h-6 object-contain shrink-0" />
            <span class="text-[#efeff1]">{s.name}</span>
          </button>
        )}
      </For>
    </div>
  );
}
