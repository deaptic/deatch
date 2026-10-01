import { Blobatar } from "@blobatar/solid";
import "blobatar/motion.css";
import FeedTile from "../FeedTile.tsx";
import { chatterLook } from "./chatterLook.ts";

type Props = {
  userId: string;
  color: string;
  active: boolean;
  onClick?: (x: number, y: number) => void;
};

export default function ChatterAvatar(props: Props) {
  const look = () => chatterLook(props.color);
  return (
    <FeedTile color={look().tint} onClick={props.onClick}>
      <Blobatar
        name={props.userId}
        hue={look().hue}
        tone={look().tone}
        palette={look().palette}
        background={false}
        animate={props.active ? "always" : undefined}
        class="size-full"
      />
    </FeedTile>
  );
}
