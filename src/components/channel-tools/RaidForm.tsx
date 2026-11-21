import { createSignal } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { searchChannels } from "../../lib/api/twitch/search.ts";
import * as raid from "../../lib/services/raid.ts";
import type { SearchChannel } from "../../lib/types/index.ts";
import Avatar from "../ui/Avatar.tsx";
import FormField from "./FormField.tsx";
import SearchPicker from "../ui/SearchPicker.tsx";
import ToolForm from "./ToolForm.tsx";

type Props = {
  broadcasterId: string;
  onDone: () => void;
};

export default function RaidForm(props: Props) {
  const [target, setTarget] = createSignal<SearchChannel | null>(null);

  function submit() {
    const picked = target();
    if (!picked) return;
    raid
      .begin(props.broadcasterId, picked.user)
      .then(props.onDone)
      .catch(() => {});
  }

  return (
    <ToolForm
      submitLabel={t("CHANNEL_TOOLS_START_RAID")}
      canSubmit={target() !== null}
      onSubmit={submit}
      onCancel={props.onDone}
    >
      <FormField label={t("CHANNEL_TOOLS_RAID_CHANNEL")}>
        <SearchPicker
          autofocus
          label={t("CHANNEL_TOOLS_RAID_CHANNEL")}
          placeholder={t("CHANNEL_TOOLS_SEARCH_LIVE")}
          search={(query) =>
            searchChannels({ query, first: 8 }, { silent: true }).then(
              (found) => found.filter((c) => c.isLive),
            )
          }
          name={(c) => c.user.displayName}
          picture={(c) => (
            <Avatar
              src={c.profileImageUrl}
              alt={c.user.displayName}
              size={24}
            />
          )}
          onPick={(c: SearchChannel | null) => setTarget(c)}
        />
      </FormField>
    </ToolForm>
  );
}
