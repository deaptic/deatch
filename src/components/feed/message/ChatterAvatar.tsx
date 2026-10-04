import FeedTile from "../FeedTile.tsx";
import { chatterLook } from "./chatterLook.ts";
import ChatterPicture from "./ChatterPicture.tsx";

type Props = {
  userId: string;
  color: string;
  active: boolean;
  onClick?: (x: number, y: number) => void;
};

export default function ChatterAvatar(props: Props) {
  return (
    <FeedTile color={chatterLook(props.color).tint} onClick={props.onClick}>
      <ChatterPicture
        userId={props.userId}
        color={props.color}
        active={props.active}
      />
    </FeedTile>
  );
}
