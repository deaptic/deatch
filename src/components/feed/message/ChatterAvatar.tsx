import { createEffect, createSignal, on, Show } from "solid-js";
import { Blobatar } from "@blobatar/solid";
import "blobatar/motion.css";
import * as users from "../../../lib/services/users.ts";
import { knownUser } from "../../../lib/stores/users.ts";
import { feedShowAvatars } from "../../../lib/stores/preferences.ts";
import { sizedAvatarUrl } from "../../../lib/utils/avatar.ts";
import FeedTile from "../FeedTile.tsx";
import { chatterLook } from "./chatterLook.ts";

const IMAGE_PX = 70;

type Props = {
  userId: string;
  color: string;
  active: boolean;
  onClick?: (x: number, y: number) => void;
};

export default function ChatterAvatar(props: Props) {
  const look = () => chatterLook(props.color);
  const [loaded, setLoaded] = createSignal(false);
  const [failed, setFailed] = createSignal(false);
  const url = () =>
    (feedShowAvatars() && knownUser(props.userId)?.profileImageUrl) || null;
  const showingImage = () => !!url() && loaded() && !failed();

  createEffect(on([() => props.userId, feedShowAvatars], ([id, show]) => {
    if (show) users.request(id);
  }));

  createEffect(on(url, () => {
    setLoaded(false);
    setFailed(false);
  }, { defer: true }));

  return (
    <FeedTile color={look().tint} onClick={props.onClick}>
      <Show when={!showingImage()}>
        <Blobatar
          name={props.userId}
          hue={look().hue}
          tone={look().tone}
          palette={look().palette}
          background={false}
          animate={props.active ? "always" : undefined}
          class="size-full col-start-1 row-start-1"
        />
      </Show>
      <Show when={!failed() && url()}>
        {(src) => (
          <img
            src={sizedAvatarUrl(src(), IMAGE_PX)}
            alt=""
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            class={`size-full object-cover col-start-1 row-start-1 ${
              showingImage() ? "" : "invisible"
            }`}
          />
        )}
      </Show>
    </FeedTile>
  );
}
