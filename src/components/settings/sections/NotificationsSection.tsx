import { For, Show } from "solid-js";
import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import Chip from "../../ui/Chip.tsx";
import ChipInput from "../../ui/ChipInput.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  addFeedKeyword,
  feedKeywords,
  notificationsMentionSound,
  removeFeedKeyword,
  setNotificationsMentionSound,
} from "../../../lib/stores/preferences.ts";

export default function NotificationsSection() {
  return (
    <PageBody
      title="Notifications"
      lede="How Deatch gets your attention when something needs it."
    >
      <Card>
        <SettingsRow
          label="Highlight keywords"
          description="Messages with these words light up like mentions and land in your inbox. Use * for part of a word: drop* matches drops and dropped."
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
        <SettingsRow
          label="Mention sound"
          description="Play a sound when someone mentions you or uses one of your keywords."
        >
          <Toggle
            label="Mention sound"
            checked={notificationsMentionSound()}
            onChange={setNotificationsMentionSound}
          />
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
