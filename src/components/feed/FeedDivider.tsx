export default function FeedDivider() {
  return (
    <div class="flex items-center gap-3 my-1.5 pl-3 select-none pointer-events-none">
      <div class="flex-1 border-t border-dotted border-accent" />
      <span class="text-micro text-accent-ink px-2">New messages</span>
      <div class="flex-1 border-t border-dotted border-accent" />
    </div>
  );
}
