import { Unplug } from "lucide-solid";

export default function ConnectionBanner() {
  return (
    <div
      role="status"
      class="flex items-center gap-3 px-4 py-2.5 bg-raised border-b border-line-soft"
    >
      <Unplug class="size-4 shrink-0 text-caution" />
      <span class="min-w-0 truncate text-body text-ink">
        Chat disconnected.{" "}
        <span class="text-ink-soft">
          Reconnecting… messages sent meanwhile are filled in afterwards.
        </span>
      </span>
    </div>
  );
}
