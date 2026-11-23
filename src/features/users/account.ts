import { createSignal } from "solid-js";
import type { User } from "../../shared/types/index.ts";

export const [user, setUser] = createSignal<User | null>(null);
