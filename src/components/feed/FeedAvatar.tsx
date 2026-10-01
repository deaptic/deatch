import { Blobatar } from "@blobatar/solid";
import "blobatar/motion.css";
import FeedTile from "./FeedTile.tsx";

type Props = {
  userId: string;
  active: boolean;
  onClick?: (x: number, y: number) => void;
};

export default function FeedAvatar(props: Props) {
  return (
    <FeedTile onClick={props.onClick}>
      <Blobatar
        name={props.userId}
        background={false}
        animate={props.active ? "always" : undefined}
        class="size-full"
      />
    </FeedTile>
  );
}
