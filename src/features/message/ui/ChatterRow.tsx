import type { Chatter } from "../../users/index.ts";
import { nameColor } from "../index.ts";
import Text from "../../../kit/Text.tsx";

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
      <Text size="sm" bold tone="soft" class="shrink-0">
        {props.chatter.displayName.toLowerCase() !== props.chatter.login
          ? props.chatter.login
          : ""}
      </Text>
    </>
  );
}
