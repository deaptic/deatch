import { For } from "solid-js";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import UserListEditor from "../UserListEditor.tsx";
import { EVENTS } from "../../../lib/constants.ts";
import {
  feedEvents,
  feedUserMuted,
  muteUser,
  setFeedEvent,
  unmuteUser,
} from "../../../lib/stores/preferences.ts";

export default function ShownInChatCard() {
  return (
    <Card>
      <CardLabel>Shown in chat</CardLabel>
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
    </Card>
  );
}
