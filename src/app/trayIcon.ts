import type { IconPixels } from "../platform/tray.ts";
import { canvasPng } from "./canvasPng.ts";

const SIZE = 32;
const DOT_RADIUS = 7;

export function trayIconPng(
  base: IconPixels,
  fill: string,
): Promise<Uint8Array | null> {
  const source = document.createElement("canvas");
  source.width = base.width;
  source.height = base.height;
  source
    .getContext("2d")
    ?.putImageData(
      new ImageData(new Uint8ClampedArray(base.rgba), base.width, base.height),
      0,
      0,
    );
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(source, 0, 0, SIZE, SIZE);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(SIZE - DOT_RADIUS, SIZE - DOT_RADIUS, DOT_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  return canvasPng(canvas);
}
