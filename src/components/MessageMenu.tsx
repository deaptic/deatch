import { Show, createSignal } from "solid-js";
import ReplyIcon from "../icons/ReplyIcon";
import DotsIcon from "../icons/DotsIcon";
import CopyIcon from "../icons/CopyIcon";
import TrashIcon from "../icons/TrashIcon";

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
          <ReplyIcon class="w-3.5 h-3.5" />
        </button>
        <button
          title="More options"
          onClick={openMenu}
          class="w-7 h-7 flex items-center justify-center rounded text-[#6e6e8f] hover:text-[#efeff1] hover:bg-[#2d2d35] transition-colors cursor-pointer"
        >
          <DotsIcon class="w-3.5 h-3.5" />
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
            icon={<ReplyIcon class="w-3.5 h-3.5" />}
          />
          <MenuItem
            label="Copy Text"
            onClick={() => { props.onCopy(); closeMenu(); }}
            icon={<CopyIcon class="w-3.5 h-3.5" />}
          />
          <div class="border-t border-[#2d2d35] my-1" />
          <MenuItem
            label="Delete Message"
            onClick={() => { props.onDelete(); closeMenu(); }}
            danger
            icon={<TrashIcon class="w-3.5 h-3.5" />}
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
