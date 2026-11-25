import { ImageIcon } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import Button from "./Button.tsx";
import Thumbnail from "./Thumbnail.tsx";

type Props = {
  src: string;
  label: string;
};

export default function RevealImage(props: Props) {
  const [shown, setShown] = createSignal(false);
  return (
    <span class="block">
      <Show
        when={shown()}
        fallback={
          <Button
            variant="neutral"
            size="sm"
            icon={<ImageIcon class="size-4" />}
            onClick={() => setShown(true)}
          >
            {props.label}
          </Button>
        }
      >
        <Thumbnail src={props.src} shape="native" fit="media" />
      </Show>
    </span>
  );
}
