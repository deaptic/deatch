import { dayLabel } from "../../lib/utils/feedLayout.ts";

export default function FeedDayDivider(props: { ts: number }) {
  return (
    <div
      role="separator"
      class="flex items-center gap-3 my-2 pl-3 select-none pointer-events-none"
    >
      <div class="flex-1 border-t border-line-soft" />
      <span class="h-6 px-3 inline-flex items-center rounded-full border border-line-soft text-small font-semibold text-ink-soft">
        {dayLabel(props.ts, Date.now())}
      </span>
      <div class="flex-1 border-t border-line-soft" />
    </div>
  );
}
