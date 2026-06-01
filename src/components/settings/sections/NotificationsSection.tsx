import SettingsContent from "../SettingsContent";
import SettingsContentSection from "../SettingsContentSection";
import SettingsContentSectionItem from "../SettingsContentSectionItem";
import Toggle from "../../ui/Toggle";
import {
  notificationsMentionSound,
  setNotificationsMentionSound,
} from "../../../lib/stores/preferences";

export default function NotificationsSection() {
  return (
    <SettingsContent title="Notifications">
      <SettingsContentSection>
        <SettingsContentSectionItem
          label="Mention ping sound"
          description="Play a sound when someone mentions you or a keyword matches."
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
