import type { JSX } from "solid-js";

type Props = {
  icon: JSX.Element;
  title: JSX.Element;
  children: JSX.Element;
};

export default function ActivityRow(props: Props) {
  return (
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-1 text-small enter-rise">
      <span class="shrink-0 text-accent-ink [&>svg]:size-4">{props.icon}</span>
      <span class="flex-1 basis-40 min-w-0 truncate text-ink">
        {props.title}
      </span>
      {props.children}
    </div>
  );
}
