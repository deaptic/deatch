import SettingsContent from "../SettingsContent.tsx";
import SettingsContentSection from "../SettingsContentSection.tsx";
import SettingsContentSectionItem from "../SettingsContentSectionItem.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  moderationActionsDisabled,
  moderationAutoShoutoutOnRaid,
  setModerationActionsDisabled,
  setModerationAutoShoutoutOnRaid,
} from "../../../lib/stores/preferences.ts";

export default function ModerationSection() {
  return (
    <SettingsContent title="Moderation">
      <SettingsContentSection>
        <SettingsContentSectionItem
          label="Auto-shoutout on raid"
          description="Shout out raiders in channels you own or mod."
        >
          <Toggle
            size="md"
            checked={moderationAutoShoutoutOnRaid()}
            onChange={setModerationAutoShoutoutOnRaid}
          />
        </SettingsContentSectionItem>
        <SettingsContentSectionItem
          label="Disable moderation actions"
          description="Hide all mod controls (ban, timeout, delete) everywhere."
        >
          <Toggle
            size="md"
            checked={moderationActionsDisabled()}
            onChange={setModerationActionsDisabled}
          />
        </SettingsContentSectionItem>
      </SettingsContentSection>
    </SettingsContent>
  );
}
