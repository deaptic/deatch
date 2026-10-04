import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  moderationActionsDisabled,
  moderationAutoShoutoutOnRaid,
  setModerationActionsDisabled,
  setModerationAutoShoutoutOnRaid,
} from "../../../lib/stores/preferences.ts";

export default function ModerationSection() {
  return (
    <PageBody
      title="Moderation"
      lede="Tools for channels you own or moderate."
    >
      <Card>
        <SettingsRow
          label="Shout out raiders"
          description="Automatically shout out anyone who raids a channel you own or moderate."
        >
          <Toggle
            label="Shout out raiders"
            checked={moderationAutoShoutoutOnRaid()}
            onChange={setModerationAutoShoutoutOnRaid}
          />
        </SettingsRow>
        <SettingsRow
          label="Hide moderation actions"
          description="Hide the ban, timeout, and delete buttons everywhere."
        >
          <Toggle
            label="Hide moderation actions"
            checked={moderationActionsDisabled()}
            onChange={setModerationActionsDisabled}
          />
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
