import SettingsContent from "../SettingsContent.tsx";
import SettingsContentSection from "../SettingsContentSection.tsx";
import SettingsContentSectionItem from "../SettingsContentSectionItem.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  notificationsMentionSound,
  setNotificationsMentionSound,
} from "../../../lib/stores/preferences.ts";

export default function NotificationsSection() {
  return (
    <SettingsContent title="Notifications">
      <SettingsContentSection>
        <SettingsContentSectionItem
          label="Mention ping sound"
          description="Play a sound on mentions and keyword matches."
        >
          <Toggle
            size="md"
            checked={notificationsMentionSound()}
            onChange={setNotificationsMentionSound}
          />
        </SettingsContentSectionItem>
      </SettingsContentSection>
    </SettingsContent>
  );
}
