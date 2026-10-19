import { Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { FeedMessage, UserRef } from "../../../lib/types/index.ts";
import {
  onMiddleClick,
  preventAutoscroll,
} from "../../../lib/utils/middleClick.ts";
import { channelUrl } from "../../../lib/utils/twitchUrl.ts";
import FeedTile from "../FeedTile.tsx";
import { chatterLook } from "./chatterLook.ts";
import ChatterPicture from "./ChatterPicture.tsx";
import SourceChannel from "./SourceChannel.tsx";

type Props = {
  userId: string;
  login: string;
  color: string;
  active: boolean;
  source?: FeedMessage["source"];
  onOpenSource?: (channelId: string) => void;
  onSourceContextMenu?: (
    x: number,
    y: number,
    identity: Partial<UserRef>,
  ) => void;
  onClick?: (x: number, y: number) => void;
  onContextMenu?: (x: number, y: number) => void;
};

export default function ChatterAvatar(props: Props) {
  return (
    <span
      class="relative shrink-0 grid"
      onAuxClick={onMiddleClick(() => openUrl(channelUrl(props.login)))}
      onMouseDown={preventAutoscroll}
    >
      <FeedTile
        round
        color={chatterLook(props.color).tint}
        onClick={props.onClick}
        onContextMenu={props.onContextMenu}
      >
        <ChatterPicture
          userId={props.userId}
          color={props.color}
          active={props.active}
        />
      </FeedTile>
      <Show when={props.source}>
        {(source) => (
          <span class="absolute -bottom-1 -right-1 flex rounded-full ring-3 ring-canvas">
            <SourceChannel
              source={source()}
              round
              onOpen={props.onOpenSource}
              onContextMenu={props.onSourceContextMenu}
            />
          </span>
        )}
      </Show>
    </span>
  );
}
