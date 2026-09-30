import { For, Show } from "solid-js";
import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import ColorPicker from "../../ui/ColorPicker.tsx";
import Toggle from "../../ui/Toggle.tsx";
import Chip from "../../ui/Chip.tsx";
import ChipInput from "../../ui/ChipInput.tsx";
import UserListEditor from "../UserListEditor.tsx";
import NicknameEditor from "../NicknameEditor.tsx";
import { BADGE_CATEGORIES, EVENTS } from "../../../lib/constants.ts";
import * as preferences from "../../../lib/services/preferences.ts";
import {
  addFeedKeyword,
  feedBadges,
  feedEvents,
  feedKeywords,
  feedShowCopypasta,
  feedShowDeletedContent,
  feedShowTimestamp,
  feedUserMuted,
  feedUserNicknames,
  feedUserOverrideNameColor,
  feedUserShowDisplayName,
  muteUser,
  removeFeedKeyword,
  removeUserNickname,
  setFeedBadge,
  setFeedEvent,
  setFeedShowCopypasta,
  setFeedShowDeletedContent,
  setFeedShowTimestamp,
  setFeedUserOverrideNameColor,
  setFeedUserShowDisplayName,
  unmuteUser,
} from "../../../lib/stores/preferences.ts";

export default function FeedSection() {
  async function applyNickname(
    login: string,
    nickname: string,
  ): Promise<boolean> {
    return !!(await preferences.setUserNicknameByLogin(login, nickname));
  }

  return (
    <PageBody title="Feed" lede="What shows up in chat, and how.">
      <Card>
        <SettingsRow
          label="Show timestamps"
          description="Time next to every message."
        >
          <Toggle
            label="Show timestamps"
            checked={feedShowTimestamp()}
            onChange={setFeedShowTimestamp}
          />
        </SettingsRow>
        <SettingsRow
          label="Show deleted messages"
          description="Keep the text visible, dimmed, instead of hiding it."
        >
          <Toggle
            label="Show deleted messages"
            checked={feedShowDeletedContent()}
            onChange={setFeedShowDeletedContent}
          />
        </SettingsRow>
        <SettingsRow
          label="Copypasta button"
          description="Copy any message into your composer from its toolbar."
        >
          <Toggle
            label="Copypasta button"
            checked={feedShowCopypasta()}
            onChange={setFeedShowCopypasta}
          />
        </SettingsRow>
        <SettingsRow
          label="Highlight keywords"
          description="Messages containing these light up like mentions and land in your inbox."
          stacked
        >
          <ChipInput placeholder="Add a keyword" onAdd={addFeedKeyword} />
          <Show when={feedKeywords().length > 0}>
            <div class="flex flex-wrap gap-1.5">
              <For each={feedKeywords()}>
                {(kw) => (
                  <Chip
                    label={kw}
                    onRemove={() => removeFeedKeyword(kw)}
                  />
                )}
              </For>
            </div>
          </Show>
        </SettingsRow>
      </Card>

      <Card>
        <SettingsRow
          label="Show display names"
          description="Display names instead of logins."
        >
          <Toggle
            label="Show display names"
            checked={feedUserShowDisplayName()}
            onChange={setFeedUserShowDisplayName}
          />
        </SettingsRow>
        <SettingsRow
          label="One colour for all names"
          description="Reset to bring back each chatter's own colour."
        >
          <ColorPicker
            swatchColor={feedUserOverrideNameColor() || "transparent"}
            value={feedUserOverrideNameColor() || "#9481ff"}
            onInput={setFeedUserOverrideNameColor}
            onReset={() => setFeedUserOverrideNameColor("")}
            resetDisabled={!feedUserOverrideNameColor()}
          />
        </SettingsRow>
        <SettingsRow
          label="Muted users"
          description="Hide messages from these users everywhere."
          stacked
        >
          <UserListEditor
            ids={feedUserMuted()}
            placeholder="Mute a username"
            onAdd={(u) => muteUser(u.id)}
            onRemove={unmuteUser}
          />
        </SettingsRow>
        <SettingsRow
          label="Nicknames"
          description="Show your own name for someone in chat and cards."
          stacked
        >
          <NicknameEditor
            entries={feedUserNicknames()}
            onApply={applyNickname}
            onRemove={removeUserNickname}
          />
        </SettingsRow>
      </Card>

      <Card>
        <div class="px-5 pt-4 pb-1 text-small text-ink-faint">Events</div>
        <For each={EVENTS}>
          {(e) => (
            <SettingsRow label={e.label} description={e.description}>
              <Toggle
                label={e.label}
                checked={feedEvents()[e.key]?.show !== false}
                onChange={(v) => setFeedEvent(e.key, v)}
              />
            </SettingsRow>
          )}
        </For>
      </Card>

      <Card>
        <div class="px-5 pt-4 pb-1 text-small text-ink-faint">Badges</div>
        <For each={BADGE_CATEGORIES}>
          {(c) => (
            <SettingsRow label={c.label} description={c.description}>
              <Toggle
                label={c.label}
                checked={feedBadges()[c.key]?.show !== false}
                onChange={(v) => setFeedBadge(c.key, v)}
              />
            </SettingsRow>
          )}
        </For>
      </Card>
    </PageBody>
  );
}
