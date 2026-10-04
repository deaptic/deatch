import { createEffect, createMemo, createSignal, on, Show } from "solid-js";
import { Blobatar } from "@blobatar/solid";
import "blobatar/motion.css";
import * as users from "../../../lib/services/users.ts";
import { knownUser } from "../../../lib/stores/users.ts";
import { feedShowAvatars } from "../../../lib/stores/preferences.ts";
import { sizedAvatarUrl } from "../../../lib/utils/avatar.ts";
import FeedTile from "../FeedTile.tsx";
import { chatterLook } from "./chatterLook.ts";

const IMAGE_PX = 70;
const INSTANT_MS = 50;

type Props = {
  userId: string;
  color: string;
  active: boolean;
  onClick?: (x: number, y: number) => void;
};

export default function ChatterAvatar(props: Props) {
  const look = () => chatterLook(props.color);
  const [lookedUp, setLookedUp] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);
  const [instant, setInstant] = createSignal(false);
  const [failed, setFailed] = createSignal(false);
  const url = createMemo(() =>
    (feedShowAvatars() && knownUser(props.userId)?.profileImageUrl) || null
  );
  const showingImage = () => !!url() && loaded() && !failed();
  const noImage = () =>
    !feedShowAvatars() || failed() || (lookedUp() && !url());

  createEffect(on([() => props.userId, feedShowAvatars], ([id, show]) => {
    setLookedUp(false);
    if (!show) return;
    users.get([id]).catch(() => {}).finally(() => setLookedUp(true));
  }));

  createEffect(on(url, () => {
    setLoaded(false);
    setInstant(false);
    setFailed(false);
  }, { defer: true }));

  let shownAt = 0;

  function onLoad() {
    setInstant(performance.now() - shownAt < INSTANT_MS);
    setLoaded(true);
  }

  return (
    <FeedTile color={look().tint} onClick={props.onClick}>
      <Show when={noImage()}>
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
            ref={() => {
              shownAt = performance.now();
            }}
            src={sizedAvatarUrl(src(), IMAGE_PX)}
            alt=""
            decoding="async"
            onLoad={onLoad}
            onError={() => setFailed(true)}
            class={`size-full object-cover col-start-1 row-start-1 ${
              instant() ? "" : "transition-opacity duration-quick ease-out"
            } ${showingImage() ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </Show>
    </FeedTile>
  );
}
