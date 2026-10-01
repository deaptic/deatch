import { createEffect } from "solid-js";
import { setMentionsBadge } from "../api/notifications.ts";
import * as appearance from "../services/appearance.ts";
import { unreadMentionCount } from "../stores/inbox.ts";

type BadgeLook = { fill: string; text: string; font: string };

async function renderBadgeBytes(
  count: number,
  look: BadgeLook,
): Promise<number[] | null> {
  if (count === 0) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = look.fill;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(16, 16, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.text;
  ctx.font = `bold 22px ${look.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(count > 9 ? "9+" : String(count), 16, 17);
  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob((b) => r(b), "image/png")
  );
  if (!blob) return null;
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
}

export function createMentionsBadge(): void {
  let last = "";
  createEffect(() => {
    const count = unreadMentionCount();
    const look: BadgeLook = {
      fill: appearance.token("color-negative"),
      text: appearance.token("color-on-accent"),
      font: appearance.token("font-sans"),
    };
    const key = `${count}/${look.fill}`;
    if (key === last) return;
    last = key;
    void (async () => {
      try {
        const bytes = await renderBadgeBytes(count, look);
        await setMentionsBadge(count, bytes);
      } catch (e) {
        console.error("failed to update mentions badge", e);
      }
    })();
  });
}
