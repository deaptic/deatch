import { createSignal, createEffect, For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { getUsers } from "../../commands/users";
import type { TwitchUser } from "../../types";
import SettingsNavigation from "./SettingsNavigation";
import SettingsNavigationItem from "./SettingsNavigationItem";
import SettingsContent from "./SettingsContent";
import SettingsContentSection from "./SettingsContentSection";
import SettingsContentSectionItem from "./SettingsContentSectionItem";

type SectionKey = "feed" | "notifications" | "appearance" | "advanced";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "notifications", label: "Notifications" },
  { key: "feed", label: "Feed" },
  { key: "appearance", label: "Appearance" },
  { key: "advanced", label: "Advanced" },
];
import {
  feedFontSize,
  setFeedFontSize,
  feedUserShowDisplayName,
  setFeedUserShowDisplayName,
  feedShowTimestamp,
  setFeedShowTimestamp,
  feedShowDeletedContent,
  setFeedShowDeletedContent,
  feedShowCopypasta,
  setFeedShowCopypasta,
  feedBadges,
  setFeedBadge,
  feedEvents,
  setFeedEvent,
  feedUserMuted,
  unmuteUser,
  feedKeywords,
  addFeedKeyword,
  removeFeedKeyword,
  feedUserOverrideNameColor,
  setFeedUserOverrideNameColor,
  feedUserNicknames,
  removeUserNickname,
  notificationsMentionSound,
  setNotificationsMentionSound,
  advancedDeveloperMode,
  setAdvancedDeveloperMode,
  advancedShowLogs,
  setAdvancedShowLogs,
  advancedAlwaysOnTop,
  setAdvancedAlwaysOnTop,
  advancedAutostart,
  setAdvancedAutostart,
  appearanceColors,
  setAppearanceColor,
  resetAppearanceColor,
  resetAppearanceColors,
} from "../../state/preferences";
import {
  APPEARANCE_COLOR_GROUPS,
  readAppearanceColorHex,
  type AppearanceColorKey,
} from "../../services/appearance";
import Button from "../../ui/Button";
import { muteUserByLogin, setUserNicknameByLogin } from "../../services/preferences";
import KeyValueEditor from "../../ui/KeyValueEditor";
import ChipInput from "../../ui/ChipInput";
import { BADGE_CATEGORIES, EVENTS } from "../../constants";
import Stepper from "../../ui/Stepper";
import Toggle from "../../ui/Toggle";
import Chip from "../../ui/Chip";
import ChipList from "../../ui/ChipList";
import CloseIcon from "../../icons/CloseIcon";
import { captureFocusForRestore } from "../../utils/focus";

type Props = {
  onClose: () => void;
};

export default function Settings(props: Props) {
  captureFocusForRestore();
  const [section, setSection] = createSignal<SectionKey>("notifications");
  const [mutedMeta, setMutedMeta] = createStore<Record<string, TwitchUser>>({});

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") props.onClose();
  }
  onMount(() => {
    window.addEventListener("keydown", handleKey);
    onCleanup(() => window.removeEventListener("keydown", handleKey));
  });

  // Fetch display metadata for any muted IDs we don't yet have data for.
  createEffect(() => {
    const missing = feedUserMuted().filter((id) => !mutedMeta[id]);
    if (missing.length === 0) return;
    getUsers({ userIds: missing })
      .then((users) => {
        const updates: Record<string, TwitchUser> = {};
        for (const u of users) updates[u.id] = u;
        setMutedMeta(updates);
      })
      .catch(() => {});
  });

  async function applyNickname(login: string, nickname: string): Promise<boolean> {
    return !!(await setUserNicknameByLogin(login, nickname));
  }

  async function muteByLogin(login: string) {
    const u = await muteUserByLogin(login);
    if (u) setMutedMeta(u.id, u);
  }

  return (
    <div
      class="fixed top-10 left-0 right-0 bottom-0 z-40 bg-black/60 flex items-center justify-center p-8"
      onClick={() => props.onClose()}
    >
      <div
        class="relative bg-bg-dark border border-border-muted rounded-lg shadow-2xl w-full h-full max-w-350 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="relative h-10 shrink-0 flex items-center bg-bg-dark border-b border-border-muted select-none">
          <div class="flex items-center px-3">
            <span class="text-text text-xs font-semibold tracking-tight">Settings</span>
          </div>
          <div class="flex-1" />
          <button
            onClick={() => props.onClose()}
            class="w-11 h-full flex items-center justify-center text-text-muted hover:bg-danger hover:text-text transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <CloseIcon class="w-2.5 h-2.5" />
          </button>
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
          <Show when={section() === "notifications"}>
            <SettingsContent title="Notifications">
              <SettingsContentSection>
                <SettingsContentSectionItem
                  label="Mention ping sound"
                  description="Play a sound when someone mentions you or a keyword matches."
                >
                  <Toggle size="md" checked={notificationsMentionSound()} onChange={setNotificationsMentionSound} />
                </SettingsContentSectionItem>
              </SettingsContentSection>
            </SettingsContent>
          </Show>
          <Show when={section() === "feed"}>
            <SettingsContent title="Feed">
              <SettingsContentSection title="General">
                <SettingsContentSectionItem
                  label="Text size in chat"
                  description="Adjust how big chat messages appear."
                >
                  <Stepper
                    size="md"
                    label={String(feedFontSize())}
                    onDecrement={() => setFeedFontSize(feedFontSize() - 1)}
                    onIncrement={() => setFeedFontSize(feedFontSize() + 1)}
                  />
                </SettingsContentSectionItem>
                <SettingsContentSectionItem
                  label="Show timestamps"
                  description="Display the time next to each chat message."
                >
                  <Toggle size="md" checked={feedShowTimestamp()} onChange={setFeedShowTimestamp} />
                </SettingsContentSectionItem>
                <SettingsContentSectionItem
                  label="Show deleted message contents"
                  description="Display the original text of deleted messages, greyed out. When off, deleted messages render as <deleted>."
                >
                  <Toggle size="md" checked={feedShowDeletedContent()} onChange={setFeedShowDeletedContent} />
                </SettingsContentSectionItem>
                <SettingsContentSectionItem
                  label="Copypasta button"
                  description="Show a toolbar button on each message that re-sends the same text as your own."
                >
                  <Toggle size="md" checked={feedShowCopypasta()} onChange={setFeedShowCopypasta} />
                </SettingsContentSectionItem>
              </SettingsContentSection>

              <SettingsContentSection title="Highlights">
                <SettingsContentSectionItem
                  label="Keywords"
                  description="Highlight messages containing any of these words and add them to your inbox, just like a mention."
                  stacked
                >
                  <ChipInput
                    placeholder="Add keyword..."
                    onAdd={addFeedKeyword}
                  />
                  <Show when={feedKeywords().length > 0}>
                    <ChipList>
                      <For each={feedKeywords()}>
                        {(kw) => <Chip label={kw} onRemove={() => removeFeedKeyword(kw)} />}
                      </For>
                    </ChipList>
                  </Show>
                </SettingsContentSectionItem>
              </SettingsContentSection>

              <SettingsContentSection title="Users">
                <SettingsContentSectionItem
                  label="Show display names in chat"
                  description="Show users' chosen display names instead of their login."
                >
                  <Toggle size="md" checked={feedUserShowDisplayName()} onChange={setFeedUserShowDisplayName} />
                </SettingsContentSectionItem>
                <SettingsContentSectionItem
                  label="Override name colors"
                  description="Use a single color for all chatter names. Reset to keep each user's color."
                >
                  <div class="flex items-center gap-2">
                    <label
                      class="relative w-8 h-8 rounded border border-border cursor-pointer overflow-hidden"
                      style={{ "background-color": feedUserOverrideNameColor() || "transparent" }}
                      title="Pick color"
                    >
                      <input
                        type="color"
                        class="absolute inset-0 opacity-0 cursor-pointer"
                        value={feedUserOverrideNameColor() || "#9481ff"}
                        onInput={(e) => setFeedUserOverrideNameColor(e.currentTarget.value)}
                      />
                    </label>
                    <Button
                      variant="secondary"
                      disabled={!feedUserOverrideNameColor()}
                      onClick={() => setFeedUserOverrideNameColor("")}
                    >
                      Reset
                    </Button>
                  </div>
                </SettingsContentSectionItem>
                <SettingsContentSectionItem
                  label="Muted users"
                  description="Hide messages from these users."
                  stacked
                >
                  <ChipInput
                    placeholder="Mute username..."
                    normalize={(v) => v.trim().toLowerCase()}
                    onAdd={muteByLogin}
                  />
                  <Show when={feedUserMuted().length > 0}>
                    <ChipList>
                      <For each={feedUserMuted()}>
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
                <SettingsContentSectionItem
                  label="Nicknames"
                  description="Custom names that override how users appear in the feed and user cards."
                  stacked
                >
                  <KeyValueEditor
                    entries={Object.entries(feedUserNicknames()).map(([key, value]) => ({ key, value }))}
                    keyPlaceholder="Username"
                    valuePlaceholder="Nickname"
                    onApply={applyNickname}
                    onRemove={removeUserNickname}
                  />
                </SettingsContentSectionItem>
              </SettingsContentSection>

              <SettingsContentSection title="Events">
                <For each={EVENTS}>
                  {(e) => (
                    <SettingsContentSectionItem label={e.label} description={e.description}>
                      <Toggle
                        size="md"
                        checked={feedEvents()[e.key]?.show !== false}
                        onChange={(v) => setFeedEvent(e.key, v)}
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
                        checked={feedBadges()[c.key]?.show !== false}
                        onChange={(v) => setFeedBadge(c.key, v)}
                      />
                    </SettingsContentSectionItem>
                  )}
                </For>
              </SettingsContentSection>
            </SettingsContent>
          </Show>
          <Show when={section() === "appearance"}>
            <SettingsContent title="Appearance">
              <SettingsContentSection>
                <div class="flex items-center justify-between">
                  <span class="text-text-muted text-xs">
                    Customize the colors used throughout the app. Click a swatch to pick a new color.
                  </span>
                  <Button
                    variant="secondary"
                    disabled={Object.keys(appearanceColors()).length === 0}
                    onClick={() => resetAppearanceColors()}
                  >
                    Reset all
                  </Button>
                </div>
              </SettingsContentSection>
              <For each={APPEARANCE_COLOR_GROUPS}>
                {(group) => (
                  <SettingsContentSection title={group.label}>
                    <For each={group.colors}>
                      {(c) => (
                        <SettingsContentSectionItem label={c.label}>
                          <AppearanceColorRow colorKey={c.key} />
                        </SettingsContentSectionItem>
                      )}
                    </For>
                  </SettingsContentSection>
                )}
              </For>
            </SettingsContent>
          </Show>
          <Show when={section() === "advanced"}>
            <SettingsContent title="Advanced">
              <SettingsContentSection>
                <SettingsContentSectionItem
                  label="Developer mode"
                  description="Show extra debug info and developer tools."
                >
                  <Toggle size="md" checked={advancedDeveloperMode()} onChange={setAdvancedDeveloperMode} />
                </SettingsContentSectionItem>
                <SettingsContentSectionItem
                  label="Show logs"
                  description="Surface log messages as toasts."
                >
                  <Toggle size="md" checked={advancedShowLogs()} onChange={setAdvancedShowLogs} />
                </SettingsContentSectionItem>
                <SettingsContentSectionItem
                  label="Always on top"
                  description="Keep the window above other applications."
                >
                  <Toggle size="md" checked={advancedAlwaysOnTop()} onChange={setAdvancedAlwaysOnTop} />
                </SettingsContentSectionItem>
                <SettingsContentSectionItem
                  label="Launch at startup"
                  description="Start the app automatically when you sign in."
                >
                  <Toggle size="md" checked={advancedAutostart()} onChange={setAdvancedAutostart} />
                </SettingsContentSectionItem>
              </SettingsContentSection>
            </SettingsContent>
          </Show>
        </div>
      </div>
    </div>
  );
}

function AppearanceColorRow(props: { colorKey: AppearanceColorKey }) {
  const override = () => appearanceColors()[props.colorKey];
  const pickerValue = () => override() ?? readAppearanceColorHex(props.colorKey);
  return (
    <div class="flex items-center gap-2">
      <label
        class="relative w-8 h-8 rounded border border-border cursor-pointer overflow-hidden"
        style={{ "background-color": `var(--color-${props.colorKey})` }}
        title="Pick color"
      >
        <input
          type="color"
          class="absolute inset-0 opacity-0 cursor-pointer"
          value={pickerValue()}
          onInput={(e) => setAppearanceColor(props.colorKey, e.currentTarget.value)}
        />
      </label>
      <Button
        variant="secondary"
        disabled={!override()}
        onClick={() => resetAppearanceColor(props.colorKey)}
      >
        Reset
      </Button>
    </div>
  );
}
