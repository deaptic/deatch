import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { setSettingsOpen } from "../settings-state";
import {
  fontSize,
  changeFontSize,
  useDisplayName,
  setUseDisplayName,
  developerMode,
  setDeveloperMode,
} from "../feed-prefs";
import Stepper from "../ui/Stepper";
import Toggle from "../ui/Toggle";

type SectionKey = "appearance" | "accessibility" | "notifications" | "advanced";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "notifications", label: "Notifications" },
  { key: "appearance", label: "Appearance" },
  { key: "accessibility", label: "Accessibility" },
  { key: "advanced", label: "Advanced" },
];

export default function Settings() {
  const [section, setSection] = createSignal<SectionKey>("notifications");
  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") setSettingsOpen(false);
  }
  onMount(() => {
    window.addEventListener("keydown", handleKey);
    onCleanup(() => window.removeEventListener("keydown", handleKey));
  });

  return (
    <div
      class="fixed top-10 left-0 right-0 bottom-0 z-40 bg-black/60 flex items-center justify-center p-8"
      onClick={() => setSettingsOpen(false)}
    >
      <div
        class="relative bg-[#1f1f23] border border-[#2d2d35] rounded-lg shadow-2xl w-full h-full max-w-[1400px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setSettingsOpen(false)}
          class="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center text-[#adadb8] hover:text-white hover:bg-[#2d2d35] rounded transition-colors cursor-pointer"
          title="Close"
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0 0 L10 10 M10 0 L0 10" stroke="currentColor" stroke-width="1" fill="none" />
          </svg>
        </button>
        <div class="flex items-center px-6 h-12 border-b border-[#2d2d35] shrink-0">
          <span class="text-white text-sm font-semibold">Settings</span>
        </div>
        <div class="flex-1 flex min-h-0">
          <nav class="w-48 shrink-0 border-r border-[#2d2d35] bg-[#18181b] py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
            <For each={SECTIONS}>
              {(s) => {
                const active = () => section() === s.key;
                return (
                  <button
                    onClick={() => setSection(s.key)}
                    class={`text-left text-xs px-3 py-2 rounded transition-colors cursor-pointer ${
                      active()
                        ? "bg-[#2d2d35] text-white"
                        : "text-[#adadb8] hover:bg-[#2d2d35] hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              }}
            </For>
          </nav>
          <div class="flex-1 overflow-y-auto p-6">
            <Show when={section() === "advanced"}>
              <section class="flex flex-col gap-6">
                <h2 class="text-white text-lg font-semibold">Advanced</h2>
                <div class="flex items-start justify-between gap-6">
                  <div class="flex flex-col gap-1 min-w-0">
                    <span class="text-[#efeff1] text-sm">Developer mode</span>
                    <span class="text-[#5c5c7a] text-xs">Show extra debug info and developer tools.</span>
                  </div>
                  <Toggle size="md" checked={developerMode()} onChange={setDeveloperMode} />
                </div>
              </section>
            </Show>
            <Show when={section() === "accessibility"}>
              <section class="flex flex-col gap-6">
                <h2 id="text-readability" class="text-white text-lg font-semibold scroll-mt-6">Text Readability</h2>
                <div class="flex items-start justify-between gap-6">
                  <div class="flex flex-col gap-1 min-w-0">
                    <span class="text-[#efeff1] text-sm">Text size in chat</span>
                    <span class="text-[#5c5c7a] text-xs">Adjust how big chat messages appear.</span>
                  </div>
                  <Stepper
                    size="md"
                    label={String(fontSize())}
                    onDecrement={() => changeFontSize(-1)}
                    onIncrement={() => changeFontSize(1)}
                  />
                </div>
                <div class="flex items-start justify-between gap-6">
                  <div class="flex flex-col gap-1 min-w-0">
                    <span class="text-[#efeff1] text-sm">Show display names in chat</span>
                    <span class="text-[#5c5c7a] text-xs">Show users' chosen display names instead of their login.</span>
                  </div>
                  <Toggle size="md" checked={useDisplayName()} onChange={setUseDisplayName} />
                </div>
              </section>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
