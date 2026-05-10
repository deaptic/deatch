import { createSignal } from "solid-js";
import { banUser } from "../../commands/moderation";
import type { FeedMessage } from "./types";

const DURATIONS = [
  { label: "1 minute", value: 60 },
  { label: "10 minutes", value: 600 },
  { label: "30 minutes", value: 1800 },
  { label: "1 hour", value: 3600 },
  { label: "24 hours", value: 86400 },
];

type Props = {
  action: "timeout" | "ban";
  msg: FeedMessage;
  broadcasterId: string;
  onClose: () => void;
};

export default function BanTimeoutModal(props: Props) {
  const [reason, setReason] = createSignal("");
  const [duration, setDuration] = createSignal(600);
  const [loading, setLoading] = createSignal(false);

  async function confirm() {
    setLoading(true);
    try {
      await banUser({
        broadcasterId: props.broadcasterId,
        userId: props.msg.chatter_user_id,
        duration: props.action === "ban" ? null : duration(),
        reason: reason(),
      });
      props.onClose();
    } finally {
      setLoading(false);
    }
  }

  const isBan = () => props.action === "ban";
  const title = () => isBan() ? `Ban ${props.msg.chatter_name}` : `Timeout ${props.msg.chatter_name}`;

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
    >
      <div class="bg-bg border border-border-muted rounded-lg shadow-2xl w-80 p-4 flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <span class="text-text text-sm font-semibold">{title()}</span>
          <span class="text-text-muted text-xs">
            {isBan()
              ? "This will permanently ban the user from the channel."
              : "This will prevent the user from chatting for the selected duration."}
          </span>
        </div>
        {!isBan() && (
          <div class="flex flex-col gap-1.5">
            <span class="text-text-muted text-xs">Duration</span>
            <div class="flex flex-wrap gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  onClick={() => setDuration(d.value)}
                  class={`text-xs px-2 py-1 rounded border cursor-pointer transition-colors ${
                    duration() === d.value
                      ? "bg-primary border-primary text-text"
                      : "bg-bg-light border-border text-text-muted hover:text-text hover:border-highlight"
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
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") props.onClose(); }}
          autofocus
          class="bg-bg-light text-text text-xs rounded px-2 py-1.5 border border-border focus:outline-none focus:border-primary"
        />
        <div class="flex gap-2 justify-end">
          <button
            onClick={props.onClose}
            class="text-xs text-text-muted hover:text-text bg-bg-light hover:bg-border border border-border rounded px-3 py-1.5 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={loading()}
            class="text-xs text-text bg-danger hover:bg-danger/80 disabled:opacity-50 rounded px-3 py-1.5 cursor-pointer transition-colors"
          >
            {isBan() ? "Ban" : "Timeout"}
          </button>
        </div>
      </div>
    </div>
  );
}
