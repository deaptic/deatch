import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { setSettingsOpen } from "../settings-state";
import {
  fontSize,
  changeFontSize,
  useDisplayName,
  setUseDisplayName,
  showTimestamp,
  setShowTimestamp,
  badgePrefs,
  setBadgePref,
  notifPrefs,
  setNotifPref,
  mutedUsers,
  setMutedUsers,
  developerMode,
  setDeveloperMode,
} from "../feed-prefs";
import { BADGE_CATEGORIES, NOTIF_EVENTS } from "../constants";
import Stepper from "../ui/Stepper";
import Toggle from "../ui/Toggle";

type SectionKey = "feed" | "notifications" | "advanced";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "notifications", label: "Notifications" },
  { key: "feed", label: "Feed" },
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
            <Show when={section() === "feed"}>
              <section class="flex flex-col gap-8">
                <h2 class="text-white text-lg font-semibold">Feed</h2>
                <div class="flex flex-col gap-3">
                  <h3 class="text-[#adadb8] text-xs font-medium uppercase tracking-wider">General</h3>
                  <div class="flex items-start justify-between gap-6">
                    <div class="flex flex-col gap-1 min-w-0">
                      <span class="text-[#efeff1] text-sm">Text size in chat</span>
                      <span class="text-[#adadb8] text-xs">Adjust how big chat messages appear.</span>
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
                      <span class="text-[#efeff1] text-sm">Show timestamps</span>
                      <span class="text-[#adadb8] text-xs">Display the time next to each chat message.</span>
                    </div>
                    <Toggle size="md" checked={showTimestamp()} onChange={setShowTimestamp} />
                  </div>
                </div>

                <div class="flex flex-col gap-3">
                  <h3 class="text-[#adadb8] text-xs font-medium uppercase tracking-wider">Users</h3>
                  <div class="flex items-start justify-between gap-6">
                    <div class="flex flex-col gap-1 min-w-0">
                      <span class="text-[#efeff1] text-sm">Show display names in chat</span>
                      <span class="text-[#adadb8] text-xs">Show users' chosen display names instead of their login.</span>
                    </div>
                    <Toggle size="md" checked={useDisplayName()} onChange={setUseDisplayName} />
                  </div>
                  <div class="flex flex-col gap-2">
                    <div class="flex flex-col gap-1 min-w-0">
                      <span class="text-[#efeff1] text-sm">Muted users</span>
                      <span class="text-[#adadb8] text-xs">Hide messages from these users. Press Enter to add.</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Mute username..."
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        const v = e.currentTarget.value.trim().toLowerCase();
                        e.currentTarget.value = "";
                        if (!v || mutedUsers().includes(v)) return;
                        setMutedUsers([...mutedUsers(), v]);
                      }}
                      class="bg-[#2d2d35] text-[#efeff1] text-sm rounded px-2 py-1.5 border border-[#3d3d4a] focus:outline-none focus:border-[#9146ff]"
                    />
                    <Show when={mutedUsers().length > 0}>
                      <div class="flex flex-wrap gap-1">
                        <For each={mutedUsers()}>
                          {(name) => (
                            <span class="flex items-center gap-1 bg-[#2d2d35] border border-[#3d3d4a] rounded px-2 py-0.5 text-xs text-[#efeff1]">
                              {name}
                              <button
                                onClick={() => setMutedUsers(mutedUsers().filter((n) => n !== name))}
                                class="text-[#6e6e8f] hover:text-white cursor-pointer leading-none"
                                title="Remove"
                              >
                                ×
                              </button>
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                </div>

                <div class="flex flex-col gap-3">
                  <h3 class="text-[#adadb8] text-xs font-medium uppercase tracking-wider">Events</h3>
                  <For each={NOTIF_EVENTS}>
                    {(e) => (
                      <div class="flex items-start justify-between gap-6">
                        <div class="flex flex-col gap-1 min-w-0">
                          <span class="text-[#efeff1] text-sm">{e.label}</span>
                          <span class="text-[#adadb8] text-xs">{e.description}</span>
                        </div>
                        <Toggle
                          size="md"
                          checked={notifPrefs()[e.key]?.show !== false}
                          onChange={(v) => setNotifPref(e.key, v)}
                        />
                      </div>
                    )}
                  </For>
                </div>

                <div class="flex flex-col gap-3">
                  <h3 class="text-[#adadb8] text-xs font-medium uppercase tracking-wider">Badges</h3>
                  <For each={BADGE_CATEGORIES}>
                    {(c) => (
                      <div class="flex items-start justify-between gap-6">
                        <div class="flex flex-col gap-1 min-w-0">
                          <span class="text-[#efeff1] text-sm">{c.label}</span>
                          <span class="text-[#adadb8] text-xs">{c.description}</span>
                        </div>
                        <Toggle
                          size="md"
                          checked={badgePrefs()[c.key]?.show !== false}
                          onChange={(v) => setBadgePref(c.key, v)}
                        />
                      </div>
                    )}
                  </For>
                </div>
              </section>
            </Show>
            <Show when={section() === "advanced"}>
              <section class="flex flex-col gap-3">
                <h2 class="text-white text-lg font-semibold">Advanced</h2>
                <div class="flex items-start justify-between gap-6">
                  <div class="flex flex-col gap-1 min-w-0">
                    <span class="text-[#efeff1] text-sm">Developer mode</span>
                    <span class="text-[#adadb8] text-xs">Show extra debug info and developer tools.</span>
                  </div>
                  <Toggle size="md" checked={developerMode()} onChange={setDeveloperMode} />
                </div>
              </section>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
