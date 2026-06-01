import { createEffect } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { unreadMentionCount } from "../stores/inbox";

async function renderBadgeBytes(count: number): Promise<number[] | null> {
  if (count === 0) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#E5393580";
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#E53935";
  ctx.beginPath();
  ctx.arc(16, 16, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(count > 9 ? "9+" : String(count), 16, 17);
  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob((b) => r(b), "image/png"),
  );
  if (!blob) return null;
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
}

export function createMentionsBadge(): void {
  createEffect(() => {
    const count = unreadMentionCount();
    void (async () => {
      try {
        const bytes = await renderBadgeBytes(count);
        await invoke("set_mentions_badge", { count, iconBytes: bytes });
      } catch {}
    })();
  });
}
