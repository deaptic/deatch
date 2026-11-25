import type { JSX } from "solid-js";

type Props = {
  icon: JSX.Element;
  title: string;
  detail?: string;
};

export default function SummaryCard(props: Props) {
  return (
    <div class="flex items-start gap-3 rounded-md bg-raised p-3">
      <span class="grid size-8 shrink-0 place-items-center rounded-sm bg-overlay text-ink-soft [&>svg]:size-4">
        {props.icon}
      </span>
      <span class="flex min-w-0 flex-col gap-0.5">
        <span class="truncate text-base font-semibold text-ink">
          {props.title}
        </span>
        <span class="line-clamp-2 break-all text-sm text-ink-faint">
          {props.detail}
        </span>
      </span>
    </div>
  );
}
