import { createSignal } from "solid-js";
import type { UserInfo } from "./types";

const [user, setUser] = createSignal<UserInfo | null>(null);
export { user, setUser };
