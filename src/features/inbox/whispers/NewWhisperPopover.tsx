import { t } from "../../../shared/i18n/index.ts";
import { avatarZoom } from "../../../shared/avatar.ts";
import type { UserRef } from "../../../shared/types/index.ts";
import Avatar from "../../../kit/Avatar.tsx";
import Popover from "../../../kit/Popover.tsx";
import SearchPicker from "../../../kit/SearchPicker.tsx";
import { channelSearch } from "../../channels/index.ts";

type Props = {
  x: number;
  y: number;
  opener: () => HTMLElement | undefined;
  onPick: (peer: UserRef) => void;
  onClose: () => void;
};

export default function NewWhisperPopover(props: Props) {
  return (
    <Popover
      x={props.x}
      y={props.y}
      opener={props.opener}
      onClose={props.onClose}
    >
      <div class="w-72 p-2">
        <SearchPicker
          autofocus
          label={t("WHISPERS_NEW_PLACEHOLDER")}
          placeholder={t("WHISPERS_NEW_PLACEHOLDER")}
          search={(query) => channelSearch.find(query)}
          name={(c) => c.user.displayName}
          picture={(c) => (
            <Avatar
              src={c.profileImageUrl}
              zoom={avatarZoom(c.profileImageUrl)}
              alt={c.user.displayName}
              size="xs"
            />
          )}
          onSelect={(c) => {
            if (!c) return;
            props.onPick(c.user);
            props.onClose();
          }}
        />
      </div>
    </Popover>
  );
}
