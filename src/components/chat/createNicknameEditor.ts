import { createSignal } from "solid-js";
import { createPopover } from "./createPopover.ts";
import { feedUserNickname, setUserNickname, removeUserNickname } from "../../lib/stores/preferences.ts";

export function createNicknameEditor() {
  const popover = createPopover<{ login: string }>();
  const [input, setInput] = createSignal("");

  function open(login: string, x: number, y: number) {
    setInput(feedUserNickname(login) ?? "");
    popover.open(x, y, { login });
  }

  function close() {
    popover.close();
    setInput("");
  }

  function submit() {
    const p = popover.state();
    if (!p) return;
    const v = input().trim();
    if (v) setUserNickname(p.login, v);
    else removeUserNickname(p.login);
    close();
  }

  return {
    state: popover.state,
    input,
    setInput,
    open,
    close,
    submit,
  };
}
