import type { Chatter } from "../../lib/types/index.ts";
import { nameColor } from "../ui/nameColor.ts";

/// A chatter in a suggestion list: the name in their colour, and the login
/// beside it when the name is not just the login recased.
export default function ChatterRow(props: {
  chatter: Pick<Chatter, "login" | "displayName" | "color">;
}) {
  return (
    <>
      <span
        class="font-semibold text-left truncate text-(--name)"
        style={{ "--name": nameColor(props.chatter.color) }}
      >
        {props.chatter.displayName}
      </span>
      <span class="flex-1" />
      <span class="text-small font-semibold shrink-0 text-ink-soft">
        {props.chatter.displayName.toLowerCase() !== props.chatter.login
          ? props.chatter.login
          : ""}
      </span>
    </>
  );
}
