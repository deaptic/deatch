import type { ChatterPresence } from "../../../lib/stores/deatch.ts";
import FeedTile from "../FeedTile.tsx";
import { chatterLook } from "./chatterLook.ts";
import ChatterPicture from "./ChatterPicture.tsx";

type Props = {
  userId: string;
  color: string;
  active: boolean;
  presence?: ChatterPresence;
  onClick?: (x: number, y: number) => void;
  onContextMenu?: (x: number, y: number) => void;
};

export default function ChatterAvatar(props: Props) {
  return (
    <FeedTile
      round
      color={chatterLook(props.color).tint}
      presence={props.presence}
      onClick={props.onClick}
      onContextMenu={props.onContextMenu}
    >
      <ChatterPicture
        userId={props.userId}
        color={props.color}
        active={props.active}
      />
    </FeedTile>
  );
}
