type Props = {
  count: number;
  floating?: boolean;
};

export default function Badge(props: Props) {
  return (
    <span
      class={`inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 rounded-full bg-negative text-on-accent text-micro font-bold tabular-nums leading-none ${
        props.floating ? "ring-2 ring-surface" : ""
      }`}
    >
      {props.count > 99 ? "99+" : props.count}
    </span>
  );
}
