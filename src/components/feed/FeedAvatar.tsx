import { Blobatar } from "@blobatar/solid";
import "blobatar/motion.css";
import { hueOf } from "../../lib/utils/color.ts";
import FeedTile from "./FeedTile.tsx";

const VIVID_TONE = 0.7;
const GREY = { head: "#8c8c8c", eye: "#1c1c1c" };

type Props = {
  userId: string;
  color: string;
  active: boolean;
  onClick?: (x: number, y: number) => void;
};

export default function FeedAvatar(props: Props) {
  const hue = () => hueOf(props.color);
  return (
    <FeedTile
      color={hue() === undefined ? undefined : props.color}
      onClick={props.onClick}
    >
      <Blobatar
        name={props.userId}
        hue={hue()}
        tone={hue() === undefined ? undefined : VIVID_TONE}
        palette={hue() === undefined ? GREY : undefined}
        background={false}
        animate={props.active ? "always" : undefined}
        class="size-full"
      />
    </FeedTile>
  );
}
