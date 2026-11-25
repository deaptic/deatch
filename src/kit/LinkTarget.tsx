import { Globe } from "lucide-solid";

type Props = {
  domain: string;
  url: string;
};

export default function LinkTarget(props: Props) {
  return (
    <div class="flex items-start gap-3 rounded-md bg-raised p-3">
      <span class="grid size-8 shrink-0 place-items-center rounded-sm bg-overlay text-ink-soft">
        <Globe class="size-4" />
      </span>
      <span class="flex min-w-0 flex-col gap-0.5">
        <span class="truncate text-base font-semibold text-ink">
          {props.domain}
        </span>
        <span class="line-clamp-2 break-all text-sm text-ink-faint">
          {props.url}
        </span>
      </span>
    </div>
  );
}
