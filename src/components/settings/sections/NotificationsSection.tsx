import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  notificationsMentionSound,
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
          label="Mention sound"
          description="Play a sound on mentions and keyword matches."
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
