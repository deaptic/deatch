import { startResizeDragging } from "../../lib/api/window.ts";
import type { ResizeDir } from "../../lib/types/index.ts";

export default function ResizeHandle(props: { dir: ResizeDir; class: string }) {
  return (
    <div
      class={`absolute z-50 ${props.class}`}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        startResizeDragging(props.dir).catch(() => {});
      }}
    />
  );
}
