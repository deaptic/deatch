export default function FeedDivider() {
  return (
    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 leading-[1.6] px-2 py-1 -mx-2 border-l-4 border-transparent select-none pointer-events-none">
      <div class="h-[1em] flex items-center"><div class="w-full border-t border-red-500/60" /></div>
      <span class="text-[0.65em] font-bold text-red-500 uppercase tracking-wider leading-none">
        New
      </span>
      <div class="h-[1em] flex items-center"><div class="w-full border-t border-red-500/60" /></div>
    </div>
  );
}
