import { createEffect, createSignal, Show } from "solid-js";

type Props = {
  src?: string;
  alt?: string;
  class?: string;
};

export default function Avatar(props: Props) {
  const [failed, setFailed] = createSignal(false);
  const initial = () => (props.alt?.trim()?.[0] ?? "?").toUpperCase();

  createEffect(() => {
    props.src;
    setFailed(false);
  });

  return (
    <div
      class={`relative flex items-center justify-center overflow-hidden bg-bg ${
        props.class ?? ""
      }`}
    >
      <Show
        when={props.src && !failed()}
        fallback={
          <span class="text-sm font-semibold text-text-muted">
            {initial()}
          </span>
        }
      >
        <img
          src={props.src}
          alt={props.alt ?? ""}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          class="absolute inset-0 size-full object-cover"
        />
      </Show>
    </div>
  );
}
