import { createSignal } from "solid-js";
import { MODIFIER_KEYS } from "./keys.ts";

type Modality = "keyboard" | "pointer";

const [modality, setModality] = createSignal<Modality>("pointer");

export const usingKeyboard = () => modality() === "keyboard";

function use(next: Modality) {
  if (modality() === next) return;
  setModality(next);
  document.documentElement.dataset.modality = next;
}

export function start(): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (!MODIFIER_KEYS.has(e.key)) use("keyboard");
  };
  const onPointer = () => use("pointer");
  document.documentElement.dataset.modality = modality();
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("pointerdown", onPointer, true);
  return () => {
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("pointerdown", onPointer, true);
  };
}
