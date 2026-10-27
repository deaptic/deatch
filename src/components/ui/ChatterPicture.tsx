import { createEffect, createMemo, createSignal, on, Show } from "solid-js";
import { Blobatar } from "@blobatar/solid";
import "blobatar/motion.css";
import * as users from "../../lib/services/users.ts";
import { knownUser } from "../../lib/stores/users.ts";
import { feedShowAvatars } from "../../lib/stores/preferences.ts";
import { avatarZoom, sizedAvatarUrl } from "../../lib/utils/avatar.ts";
import type { Palette } from "blobatar";
import * as appearance from "../../lib/services/appearance.ts";
import { hueOf } from "../../lib/utils/color.ts";

const IMAGE_PX = 70;
const INSTANT_MS = 50;
const VIVID_TONE = 0.7;

export type ChatterLook = {
  tint?: string;
  hue?: number;
  tone?: number;
  palette?: Palette;
};

export function chatterLook(color: string): ChatterLook {
  const hue = hueOf(color);
  if (hue === undefined) {
    return {
      palette: {
        head: appearance.token("color-ink-soft"),
        eye: appearance.token("color-canvas"),
      },
    };
  }
  return { tint: color, hue, tone: VIVID_TONE };
}

type Props = {
  userId: string;
  color: string;
  active?: boolean;
};

/// Fills a grid parent: the Twitch picture once loaded, a blobatar when there
/// is none, nothing while the chatter is still being looked up.
export default function ChatterPicture(props: Props) {
  const look = () => chatterLook(props.color);
  const [lookedUp, setLookedUp] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);
  const [instant, setInstant] = createSignal(false);
  const [failed, setFailed] = createSignal(false);
  // Twitch serves the same picture at 70px; the chat tile never needs 300.
  const url = createMemo(
    () =>
      (feedShowAvatars() &&
        knownUser(props.userId)?.profileImageUrl?.replace(
          "300x300",
          "70x70",
        )) ||
      null,
  );
  const showingImage = () => !!url() && loaded() && !failed();
  const noImage = () =>
    !feedShowAvatars() || failed() || (lookedUp() && !url());
  let shownAt = 0;

  createEffect(
    on([() => props.userId, feedShowAvatars], ([id, show]) => {
      setLookedUp(false);
      if (!show) return;
      users
        .get([id])
        .catch(() => {})
        .finally(() => setLookedUp(true));
    }),
  );

  createEffect(
    on(
      url,
      () => {
        setLoaded(false);
        setInstant(false);
        setFailed(false);
      },
      { defer: true },
    ),
  );

  function onLoad() {
    setInstant(performance.now() - shownAt < INSTANT_MS);
    setLoaded(true);
  }

  return (
    <>
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
            {...avatarZoom(src())}
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
    </>
  );
}
