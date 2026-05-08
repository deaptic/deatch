import { Show, createSignal } from "solid-js";

type Props = {
  onReply: () => void;
  onCopy: () => void;
  onDelete: () => void;
};

export default function MessageMenu(props: Props) {
  const [menuPos, setMenuPos] = createSignal<{ x: number; y: number } | null>(null);

  function openMenu(e: MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ x: rect.right, y: rect.bottom });
  }

  function closeMenu() {
    setMenuPos(null);
  }

  return (
    <>
      <div class="absolute right-4 inset-y-0 my-auto h-fit z-10 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-100 flex items-center gap-0.5 bg-[#1f1f23] border border-[#2d2d35] rounded-lg px-1 py-1 shadow-xl">
        <button
          title="Reply"
          onClick={(e) => { e.stopPropagation(); props.onReply(); }}
          class="w-7 h-7 flex items-center justify-center rounded text-[#6e6e8f] hover:text-[#efeff1] hover:bg-[#2d2d35] transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
          </svg>
        </button>
        <button
          title="More options"
          onClick={openMenu}
          class="w-7 h-7 flex items-center justify-center rounded text-[#6e6e8f] hover:text-[#efeff1] hover:bg-[#2d2d35] transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      <Show when={menuPos()}>
        <div class="fixed inset-0 z-40" onClick={closeMenu} />
        <div
          class="fixed z-50 w-44 bg-[#1f1f23] border border-[#2d2d35] rounded-lg shadow-2xl py-1 overflow-hidden"
          style={{ top: `${menuPos()!.y + 4}px`, right: `${window.innerWidth - menuPos()!.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            label="Reply"
            onClick={() => { props.onReply(); closeMenu(); }}
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
              </svg>
            }
          />
          <MenuItem
            label="Copy Text"
            onClick={() => { props.onCopy(); closeMenu(); }}
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            }
          />
          <div class="border-t border-[#2d2d35] my-1" />
          <MenuItem
            label="Delete Message"
            onClick={() => { props.onDelete(); closeMenu(); }}
            danger
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            }
          />
        </div>
      </Show>
    </>
  );
}

function MenuItem(props: { label: string; onClick: () => void; icon: any; danger?: boolean }) {
  return (
    <button
      class={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[#2d2d35] cursor-pointer transition-colors ${props.danger ? "text-red-400 hover:text-red-300" : "text-[#efeff1]"}`}
      onClick={props.onClick}
    >
      <span>{props.label}</span>
      {props.icon}
    </button>
  );
}
