import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { modAction, closeModAction } from "../chat-state";

const DURATIONS = [
  { label: "1 minute", value: 60 },
  { label: "10 minutes", value: 600 },
  { label: "30 minutes", value: 1800 },
  { label: "1 hour", value: 3600 },
  { label: "24 hours", value: 86400 },
];

type Props = {
  broadcasterId: string;
};

export default function BanTimeoutModal(props: Props) {
  const ma = () => modAction()!;
  const [reason, setReason] = createSignal("");
  const [duration, setDuration] = createSignal(600);
  const [loading, setLoading] = createSignal(false);

  async function confirm() {
    setLoading(true);
    try {
      if (ma().action === "ban") {
        await invoke("ban_user", {
          broadcasterId: props.broadcasterId,
          userId: ma().msg.chatter_user_id,
          reason: reason(),
        });
      } else {
        await invoke("timeout_user", {
          broadcasterId: props.broadcasterId,
          userId: ma().msg.chatter_user_id,
          duration: duration(),
          reason: reason(),
        });
      }
      closeModAction();
    } finally {
      setLoading(false);
    }
  }

  const isBan = () => ma().action === "ban";
  const title = () => isBan() ? `Ban ${ma().msg.chatter_name}` : `Timeout ${ma().msg.chatter_name}`;

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) closeModAction(); }}
    >
      <div class="bg-[#1f1f23] border border-[#2d2d35] rounded-lg shadow-2xl w-80 p-4 flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <span class="text-white text-sm font-semibold">{title()}</span>
          <span class="text-[#adadb8] text-xs">
            {isBan()
              ? "This will permanently ban the user from the channel."
              : "This will prevent the user from chatting for the selected duration."}
          </span>
        </div>
        {!isBan() && (
          <div class="flex flex-col gap-1.5">
            <span class="text-[#adadb8] text-xs">Duration</span>
            <div class="flex flex-wrap gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  onClick={() => setDuration(d.value)}
                  class={`text-xs px-2 py-1 rounded border cursor-pointer transition-colors ${
                    duration() === d.value
                      ? "bg-[#9146ff] border-[#9146ff] text-white"
                      : "bg-[#2d2d35] border-[#3d3d4a] text-[#adadb8] hover:text-white hover:border-[#6e6e8f]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <input
          type="text"
          placeholder="Reason (optional)"
          value={reason()}
          onInput={(e) => setReason(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") closeModAction(); }}
          autofocus
          class="bg-[#2d2d35] text-[#efeff1] text-xs rounded px-2 py-1.5 border border-[#3d3d4a] focus:outline-none focus:border-[#9146ff]"
        />
        <div class="flex gap-2 justify-end">
          <button
            onClick={closeModAction}
            class="text-xs text-[#adadb8] hover:text-white bg-[#2d2d35] hover:bg-[#3d3d4a] border border-[#3d3d4a] rounded px-3 py-1.5 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={loading()}
            class="text-xs text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded px-3 py-1.5 cursor-pointer transition-colors"
          >
            {isBan() ? "Ban" : "Timeout"}
          </button>
        </div>
      </div>
    </div>
  );
}
