import SettingsContent from "../SettingsContent";
import SettingsContentSection from "../SettingsContentSection";
import SettingsContentSectionItem from "../SettingsContentSectionItem";
import Toggle from "../../ui/Toggle";
import {
  moderationAutoShoutoutOnRaid,
  setModerationAutoShoutoutOnRaid,
  moderationActionsDisabled,
  setModerationActionsDisabled,
} from "../../../lib/stores/preferences";

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
