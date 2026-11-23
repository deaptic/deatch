import { createSignal } from "solid-js";
import type { User } from "../../lib/types/index.ts";

export const [user, setUser] = createSignal<User | null>(null);
