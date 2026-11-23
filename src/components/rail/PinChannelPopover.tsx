import * as channelSearch from "../../lib/services/channelSearch.ts";
import type { SearchChannel } from "../../lib/types/index.ts";
import * as pins from "../../lib/services/pins.ts";
import { pinnedChannels } from "../../lib/stores/preferences.ts";
import { user } from "../../lib/stores/users.ts";
import { userFromSearch } from "../../lib/utils/knownUsers.ts";
import Avatar from "../ui/Avatar.tsx";
import Popover from "../ui/Popover.tsx";
import SearchPicker from "../ui/SearchPicker.tsx";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  x: number;
  y: number;
  opener: () => HTMLElement | undefined;
  onClose: () => void;
};

export default function PinChannelPopover(props: Props) {
  const pinnable = (channel: SearchChannel) =>
    channel.user.id !== user()?.id &&
    !pinnedChannels().includes(channel.user.id);

  function pin(channel: SearchChannel | null) {
    if (!channel) return;
    pins.add(userFromSearch(channel));
    props.onClose();
  }

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
          label={t("RAIL_PIN_CHANNEL_LABEL")}
          placeholder={t("RAIL_PIN_CHANNEL_PLACEHOLDER")}
          search={(query) => channelSearch.find(query, pinnable)}
          name={(channel) => channel.user.displayName}
          picture={(channel) => (
            <Avatar
              src={channel.profileImageUrl}
              alt={channel.user.displayName}
              size={24}
              presence={channel.isLive ? "live" : undefined}
            />
          )}
          onPick={pin}
        />
      </div>
    </Popover>
  );
}
