import { DEFAULT_AVATAR_URL } from "../../lib/constants.ts";

type Props = {
  src?: string;
  alt?: string;
  class?: string;
}

export default function Avatar(props: Props) {
  return (
    <img
      src={props.src || DEFAULT_AVATAR_URL}
      alt={props.alt ?? ""}
      class={props.class}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        if (e.currentTarget.src !== DEFAULT_AVATAR_URL) {
          e.currentTarget.src = DEFAULT_AVATAR_URL;
        }
      }}
    />
  );
}
