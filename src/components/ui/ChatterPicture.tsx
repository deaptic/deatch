import { createEffect, createMemo, createSignal, on, Show } from "solid-js";
import * as users from "../../lib/services/users.ts";
import { knownUser } from "../../lib/stores/users.ts";
import { avatarZoom, sizedAvatarUrl } from "../../lib/utils/avatar.ts";
import { hueOf } from "../../lib/utils/color.ts";
import { createImageReveal } from "../../lib/reactive/createImageReveal.ts";

const IMAGE_PX = 70;

export function chatterTint(color: string): string | undefined {
  return hueOf(color) === undefined ? undefined : color;
}

type Props = {
  userId: string;
  name: string;
};

export default function ChatterPicture(props: Props) {
  const [failed, setFailed] = createSignal(false);
  const url = createMemo(
    () => knownUser(props.userId)?.profileImageUrl || null,
  );
  const reveal = createImageReveal(url);
  const initial = () => (props.name.trim()[0] ?? "?").toUpperCase();

  createEffect(
    on(
      () => props.userId,
      (id) => {
        users.get([id]).catch(() => {});
      },
    ),
  );

  createEffect(on(url, () => setFailed(false), { defer: true }));

  return (
    <Show
      when={!failed() && url()}
      fallback={
        <span class="col-start-1 row-start-1 grid place-items-center font-semibold select-none">
          {initial()}
        </span>
      }
    >
      {(src) => (
        <img
          ref={reveal.mount}
          src={sizedAvatarUrl(src(), IMAGE_PX)}
          {...avatarZoom(src())}
          alt=""
          decoding="async"
          onLoad={reveal.load}
          onError={() => setFailed(true)}
          class={`size-full object-cover col-start-1 row-start-1 ${reveal.fade()}`}
        />
      )}
    </Show>
  );
}
