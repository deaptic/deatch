import { createEffect, createSignal, type JSX, Show } from "solid-js";

export type AvatarSize = 24 | 32 | 36 | 40 | 64 | 80;
export type Presence = "live" | "online" | "offline";

type Props = {
  src?: string;
  alt?: string;
  size: AvatarSize;
  presence?: Presence;
  dashed?: boolean;
  square?: boolean;
  children?: JSX.Element;
};

const PRESENCE: Record<Presence, { dot: string; label: string }> = {
  live: { dot: "bg-live", label: "Live" },
  online: { dot: "bg-positive", label: "Online" },
  offline: { dot: "bg-ink-faint", label: "Offline" },
};

const SIZES: Record<AvatarSize, { box: string; dot: string }> = {
  24: { box: "size-6 text-micro", dot: "size-1.5" },
  32: { box: "size-8 text-small", dot: "size-2" },
  36: { box: "size-9 text-small", dot: "size-2.5" },
  40: { box: "size-10 text-body", dot: "size-2.5" },
  64: { box: "size-16 text-heading", dot: "size-3" },
  80: { box: "size-20 text-heading", dot: "size-4" },
};

export default function Avatar(props: Props) {
  const [failed, setFailed] = createSignal(false);
  const initial = () => (props.alt?.trim()?.[0] ?? "?").toUpperCase();
  const shape = () => (props.square ? "rounded-xs" : "rounded-full");

  createEffect(() => {
    props.src;
    setFailed(false);
  });

  return (
    <span
      class={`relative shrink-0 inline-grid place-items-center bg-raised font-semibold text-ink-soft select-none ${shape()} ${
        SIZES[props.size].box
      } ${
        props.dashed
          ? "outline-2 outline-dashed outline-offset-2 outline-line"
          : ""
      }`}
    >
      <Show when={props.src && !failed()} fallback={initial()}>
        <img
          src={props.src}
          alt={props.alt ?? ""}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          class={`absolute inset-0 size-full object-cover ${shape()}`}
        />
      </Show>
      <Show when={props.presence}>
        {(presence) => (
          <span
            title={PRESENCE[presence()].label}
            class={`absolute -bottom-px -right-px rounded-full ring-2 ring-surface ${
              PRESENCE[presence()].dot
            } ${SIZES[props.size].dot}`}
          />
        )}
      </Show>
      {props.children}
    </span>
  );
}
