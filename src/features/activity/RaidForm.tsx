import { createSignal } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import * as channelSearch from "../../lib/services/channelSearch.ts";
import * as raid from "./raid.ts";
import type { SearchChannel } from "../../lib/types/index.ts";
import Avatar from "../../kit/Avatar.tsx";
import SearchPicker from "../../kit/SearchPicker.tsx";
import FormDialog from "../../kit/FormDialog.tsx";

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
    <FormDialog
      title={t("HEADER_RAID_LABEL")}
      description={t("HEADER_RAID_DESCRIPTION")}
      submitLabel={t("HEADER_SUBMIT_RAID_LABEL")}
      canSubmit={target() !== null}
      onSubmit={submit}
      onCancel={props.onDone}
    >
      <SearchPicker
        autofocus
        label={t("HEADER_RAID_CHANNEL_LABEL")}
        placeholder={t("HEADER_RAID_CHANNEL_PLACEHOLDER")}
        search={(query) => channelSearch.find(query, (c) => c.isLive)}
        name={(c) => c.user.displayName}
        picture={(c) => (
          <Avatar src={c.profileImageUrl} alt={c.user.displayName} size={24} />
        )}
        onPick={(c: SearchChannel | null) => setTarget(c)}
      />
    </FormDialog>
  );
}
