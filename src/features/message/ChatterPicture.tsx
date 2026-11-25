import { createEffect, createMemo, on, useContext } from "solid-js";
import { ImageScale } from "../../shared/solid/imageScale.ts";
import { users } from "../users/index.ts";
import { knownUser } from "../users/index.ts";
import { avatarZoom, sizedAvatarUrl } from "../../shared/avatar.ts";
import { hueOf } from "../../shared/color.ts";
import Avatar, { type AvatarSize } from "../../kit/Avatar.tsx";

const IMAGE_PX = 70;
const SCALED_IMAGE_PX = 300;

export function chatterTint(color: string): string | undefined {
  return hueOf(color) === undefined ? undefined : color;
}

type Props = {
  userId: string;
  name: string;
  size?: AvatarSize;
};

export default function ChatterPicture(props: Props) {
  const scale = useContext(ImageScale);
  const url = createMemo(() => {
    const picture = knownUser(props.userId)?.profileImageUrl;
    return picture
      ? sizedAvatarUrl(picture, scale() > 1 ? SCALED_IMAGE_PX : IMAGE_PX)
      : undefined;
  });

  createEffect(
    on(
      () => props.userId,
      (id) => {
        users.get([id]).catch(() => {});
      },
    ),
  );

  return (
    <Avatar
      src={url()}
      zoom={avatarZoom(url())}
      alt={props.name}
      size={props.size ?? "fill"}
      inherit={!props.size}
    />
  );
}
