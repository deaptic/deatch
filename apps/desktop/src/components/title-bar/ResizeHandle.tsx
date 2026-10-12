import { getCurrentWindow } from "@tauri-apps/api/window";

export type ResizeDir =
  | "North"
  | "South"
  | "East"
  | "West"
  | "NorthEast"
  | "NorthWest"
  | "SouthEast"
  | "SouthWest";

export default function ResizeHandle(
  props: { dir: ResizeDir; class: string },
) {
  return (
    <div
      class={`absolute z-50 ${props.class}`}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        void getCurrentWindow().startResizeDragging(props.dir);
      }}
    />
  );
}
