import { t } from "../shared/i18n/index.ts";
import { createEffect } from "solid-js";
import { setTaskbarBadge } from "../platform/notifications.ts";
import { appearance } from "../features/appearance/index.ts";
import { canvasPng } from "./canvasPng.ts";

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
  ctx.fillText(
    count > 9 ? t("WINDOW_BADGE_OVERFLOW_VALUE") : String(count),
    16,
    17,
  );
  const png = await canvasPng(canvas);
  return png && Array.from(png);
}

export function createTaskbarBadge(unreadCount: () => number): void {
  let last = "";
  createEffect(() => {
    const count = unreadCount();
    const look: BadgeLook = {
      fill: appearance.token("color-negative"),
      text: appearance.token("color-on-accent"),
      font: appearance.token("font-sans"),
    };
    const key = `${count}/${look.fill}`;
    if (key === last) return;
    last = key;
    renderBadgeBytes(count, look).then(
      (bytes) => {
        if (key !== last) return;
        setTaskbarBadge({ count, iconBytes: bytes }, { silent: true }).catch(
          () => {},
        );
      },
      (e) => console.error("taskbar badge not drawn", e),
    );
  });
}
