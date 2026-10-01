import { Blobatar } from "@blobatar/solid";
import "blobatar/motion.css";
import * as appearance from "../../../lib/services/appearance.ts";
import { hueOf } from "../../../lib/utils/color.ts";
import FeedTile from "../FeedTile.tsx";

const VIVID_TONE = 0.7;

const grey = () => ({
  head: appearance.token("color-ink-soft"),
  eye: appearance.token("color-canvas"),
});

type Props = {
  userId: string;
  color: string;
  active: boolean;
  onClick?: (x: number, y: number) => void;
};

export default function ChatterAvatar(props: Props) {
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
        palette={hue() === undefined ? grey() : undefined}
        background={false}
        animate={props.active ? "always" : undefined}
        class="size-full"
      />
    </FeedTile>
  );
}
