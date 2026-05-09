import { createSignal, createEffect, For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";
import { setSettingsOpen } from "../../settings-state";
import { toast } from "../../notifications";
import type { TwitchUser } from "../../types";
import SettingsNavigation from "./SettingsNavigation";
import SettingsNavigationItem from "./SettingsNavigationItem";
import SettingsContent from "./SettingsContent";
import SettingsContentSection from "./SettingsContentSection";
import SettingsContentSectionItem from "./SettingsContentSectionItem";

type SectionKey = "feed" | "notifications" | "advanced";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "notifications", label: "Notifications" },
  { key: "feed", label: "Feed" },
  { key: "advanced", label: "Advanced" },
];
import {
  fontSize,
  setFontSize,
  useDisplayName,
  setUseDisplayName,
  showTimestamp,
  setShowTimestamp,
  badgePrefs,
  setBadgePref,
  eventPrefs,
  setEventPref,
  mutedUsers,
  muteUser,
  unmuteUser,
  developerMode,
  setDeveloperMode,
} from "../../user-prefs";
import { BADGE_CATEGORIES, EVENTS } from "../../constants";
import Stepper from "../../ui/Stepper";
import Toggle from "../../ui/Toggle";
import Chip from "../../ui/Chip";
import ChipList from "../../ui/ChipList";
import TextInput from "../../ui/TextInput";
import CloseIcon from "../../icons/CloseIcon";

export default function Settings() {
  const [section, setSection] = createSignal<SectionKey>("notifications");
  const [mutedMeta, setMutedMeta] = createStore<Record<string, TwitchUser>>({});

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") setSettingsOpen(false);
  }
  onMount(() => {
    window.addEventListener("keydown", handleKey);
    onCleanup(() => window.removeEventListener("keydown", handleKey));
  });

  // Fetch display metadata for any muted IDs we don't yet have data for.
  createEffect(() => {
    const missing = mutedUsers().filter((id) => !mutedMeta[id]);
    if (missing.length === 0) return;
    invoke<TwitchUser[]>("get_users_by_id", { userIds: missing })
      .then((users) => {
        const updates: Record<string, TwitchUser> = {};
        for (const u of users) updates[u.id] = u;
        setMutedMeta(updates);
      })
      .catch(() => {});
  });

  async function muteByLogin(login: string) {
    try {
      const users = await invoke<TwitchUser[]>("get_users_by_login", { logins: [login] });
      const u = users[0];
      if (!u) {
        toast(`User "${login}" not found`, "error");
        return;
      }
      if (mutedUsers().includes(u.id)) return;
      setMutedMeta(u.id, u);
      muteUser(u.id);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  return (
    <div
      class="fixed top-10 left-0 right-0 bottom-0 z-40 bg-black/60 flex items-center justify-center p-8"
      onClick={() => setSettingsOpen(false)}
    >
      <div
        class="relative bg-[#1f1f23] border border-[#2d2d35] rounded-lg shadow-2xl w-full h-full max-w-350 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setSettingsOpen(false)}
          class="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center text-[#adadb8] hover:text-white hover:bg-[#2d2d35] rounded transition-colors cursor-pointer"
          title="Close"
          aria-label="Close"
        >
          <CloseIcon class="w-2.5 h-2.5" />
        </button>
        <div class="flex items-center px-6 h-12 border-b border-[#2d2d35] shrink-0">
          <span class="text-white text-sm font-semibold">Settings</span>
        </div>
        <div class="flex-1 flex min-h-0">
          <SettingsNavigation>
            <For each={SECTIONS}>
              {(s) => (
                <SettingsNavigationItem
                  label={s.label}
                  active={section() === s.key}
                  onClick={() => setSection(s.key)}
                />
              )}
            </For>
          </SettingsNavigation>
          <Show when={section() === "feed"}>
            <SettingsContent title="Feed">
              <SettingsContentSection title="General">
                <SettingsContentSectionItem
                  label="Text size in chat"
                  description="Adjust how big chat messages appear."
                >
                  <Stepper
                    size="md"
                    label={String(fontSize())}
                    onDecrement={() => setFontSize(fontSize() - 1)}
                    onIncrement={() => setFontSize(fontSize() + 1)}
                  />
                </SettingsContentSectionItem>
                <SettingsContentSectionItem
                  label="Show timestamps"
                  description="Display the time next to each chat message."
                >
                  <Toggle size="md" checked={showTimestamp()} onChange={setShowTimestamp} />
                </SettingsContentSectionItem>
              </SettingsContentSection>

              <SettingsContentSection title="Users">
                <SettingsContentSectionItem
                  label="Show display names in chat"
                  description="Show users' chosen display names instead of their login."
                >
                  <Toggle size="md" checked={useDisplayName()} onChange={setUseDisplayName} />
                </SettingsContentSectionItem>
                <SettingsContentSectionItem
                  label="Muted users"
                  description="Hide messages from these users. Press Enter to add."
                  stacked
                >
                  <TextInput
                    placeholder="Mute username..."
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const v = e.currentTarget.value.trim().toLowerCase();
                      e.currentTarget.value = "";
                      if (v) muteByLogin(v);
                    }}
                  />
                  <Show when={mutedUsers().length > 0}>
                    <ChipList>
                      <For each={mutedUsers()}>
                        {(id) => (
                          <Chip
                            label={mutedMeta[id]?.display_name ?? mutedMeta[id]?.login ?? id}
                            onRemove={() => unmuteUser(id)}
                          />
                        )}
                      </For>
                    </ChipList>
                  </Show>
                </SettingsContentSectionItem>
              </SettingsContentSection>

              <SettingsContentSection title="Events">
                <For each={EVENTS}>
                  {(e) => (
                    <SettingsContentSectionItem label={e.label} description={e.description}>
                      <Toggle
                        size="md"
                        checked={eventPrefs()[e.key]?.show !== false}
                        onChange={(v) => setEventPref(e.key, v)}
                      />
                    </SettingsContentSectionItem>
                  )}
                </For>
              </SettingsContentSection>

              <SettingsContentSection title="Badges">
                <For each={BADGE_CATEGORIES}>
                  {(c) => (
                    <SettingsContentSectionItem label={c.label} description={c.description}>
                      <Toggle
                        size="md"
                        checked={badgePrefs()[c.key]?.show !== false}
                        onChange={(v) => setBadgePref(c.key, v)}
                      />
                    </SettingsContentSectionItem>
                  )}
                </For>
              </SettingsContentSection>
            </SettingsContent>
          </Show>
          <Show when={section() === "advanced"}>
            <SettingsContent title="Advanced">
              <SettingsContentSectionItem
                label="Developer mode"
                description="Show extra debug info and developer tools."
              >
                <Toggle size="md" checked={developerMode()} onChange={setDeveloperMode} />
              </SettingsContentSectionItem>
            </SettingsContent>
          </Show>
        </div>
      </div>
    </div>
  );
}
