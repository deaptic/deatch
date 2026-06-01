import { createEffect, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { getUsers, type User } from "../../../lib/api/twitch/users.ts";
import SettingsContent from "../SettingsContent.tsx";
import SettingsContentSection from "../SettingsContentSection.tsx";
import SettingsContentSectionItem from "../SettingsContentSectionItem.tsx";
import ColorPicker from "../../ui/ColorPicker.tsx";
import Stepper from "../../ui/Stepper.tsx";
import Toggle from "../../ui/Toggle.tsx";
import Chip from "../../ui/Chip.tsx";
import ChipList from "../../ui/ChipList.tsx";
import ChipInput from "../../ui/ChipInput.tsx";
import KeyValueEditor from "../../ui/KeyValueEditor.tsx";
import { BADGE_CATEGORIES, EVENTS } from "../../../lib/constants.ts";
import {
  muteUserByLogin,
  setUserNicknameByLogin,
} from "../../../lib/services/preferences.ts";
import {
  addFeedKeyword,
  feedBadges,
  feedEvents,
  feedFontSize,
  feedKeywords,
  feedShowCopypasta,
  feedShowDeletedContent,
  feedShowTimestamp,
  feedUserMuted,
  feedUserNicknames,
  feedUserOverrideNameColor,
  feedUserShowDisplayName,
  removeFeedKeyword,
  removeUserNickname,
  setFeedBadge,
  setFeedEvent,
  setFeedFontSize,
  setFeedShowCopypasta,
  setFeedShowDeletedContent,
  setFeedShowTimestamp,
  setFeedUserOverrideNameColor,
  setFeedUserShowDisplayName,
  unmuteUser,
} from "../../../lib/stores/preferences.ts";

export default function FeedSection() {
  const [mutedMeta, setMutedMeta] = createStore<Record<string, User>>({});

  createEffect(() => {
    const missing = feedUserMuted().filter((id) => !mutedMeta[id]);
    if (missing.length === 0) return;
    getUsers({ ids: missing })
      .then((users) => {
        const updates: Record<string, User> = {};
        for (const u of users) updates[u.id] = u;
        setMutedMeta(updates);
      })
      .catch(() => {});
  });

  async function applyNickname(
    login: string,
    nickname: string,
  ): Promise<boolean> {
    return !!(await setUserNicknameByLogin(login, nickname));
  }

  async function muteByLogin(login: string) {
    const u = await muteUserByLogin(login);
    if (u) setMutedMeta(u.id, u);
  }

  return (
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
          <Toggle
            size="md"
            checked={feedShowTimestamp()}
            onChange={setFeedShowTimestamp}
          />
        </SettingsContentSectionItem>
        <SettingsContentSectionItem
          label="Show deleted message contents"
          description="Display the original text of deleted messages, greyed out. When off, deleted messages render as <deleted>."
        >
          <Toggle
            size="md"
            checked={feedShowDeletedContent()}
            onChange={setFeedShowDeletedContent}
          />
        </SettingsContentSectionItem>
        <SettingsContentSectionItem
          label="Copypasta button"
          description="Show a toolbar button on each message that re-sends the same text as your own."
        >
          <Toggle
            size="md"
            checked={feedShowCopypasta()}
            onChange={setFeedShowCopypasta}
          />
        </SettingsContentSectionItem>
      </SettingsContentSection>

      <SettingsContentSection title="Highlights">
        <SettingsContentSectionItem
          label="Keywords"
          description="Highlight messages containing any of these words and add them to your inbox, just like a mention."
          stacked
        >
          <ChipInput placeholder="Add keyword..." onAdd={addFeedKeyword} />
          <Show when={feedKeywords().length > 0}>
            <ChipList>
              <For each={feedKeywords()}>
                {(kw) => (
                  <Chip
                    label={kw}
                    onRemove={() => removeFeedKeyword(kw)}
                  />
                )}
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
          <Toggle
            size="md"
            checked={feedUserShowDisplayName()}
            onChange={setFeedUserShowDisplayName}
          />
        </SettingsContentSectionItem>
        <SettingsContentSectionItem
          label="Override name colors"
          description="Use a single color for all chatter names. Reset to keep each user's color."
        >
          <ColorPicker
            swatchColor={feedUserOverrideNameColor() || "transparent"}
            value={feedUserOverrideNameColor() || "#9481ff"}
            onInput={setFeedUserOverrideNameColor}
            onReset={() => setFeedUserOverrideNameColor("")}
            resetDisabled={!feedUserOverrideNameColor()}
          />
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
                    label={mutedMeta[id]?.displayName ?? mutedMeta[id]?.login ??
                      id}
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
            entries={Object.entries(feedUserNicknames()).map((
              [key, value],
            ) => ({ key, value }))}
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
            <SettingsContentSectionItem
              label={e.label}
              description={e.description}
            >
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
            <SettingsContentSectionItem
              label={c.label}
              description={c.description}
            >
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
  );
}
