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
          description="Automatically shout out the raider on any channel you broadcast or moderate."
        >
          <Toggle
            size="md"
            checked={moderationAutoShoutoutOnRaid()}
            onChange={setModerationAutoShoutoutOnRaid}
          />
        </SettingsContentSectionItem>
        <SettingsContentSectionItem
          label="Disable moderation actions"
          description="Hide ban, timeout, delete and other moderation controls in every channel — including ones you broadcast or moderate."
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
