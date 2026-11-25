import type { Chatter } from "../../users/index.ts";
import { nameColor } from "../index.ts";
import Text from "../../../kit/Text.tsx";

export default function ChatterRow(props: {
  chatter: Pick<Chatter, "login" | "displayName" | "color">;
}) {
  return (
    <>
      <Text bold truncate align="left" color={nameColor(props.chatter.color)}>
        {props.chatter.displayName}
      </Text>
      <span class="flex-1" />
      <Text size="sm" bold tone="soft" class="shrink-0">
        {props.chatter.displayName.toLowerCase() !== props.chatter.login
          ? props.chatter.login
          : ""}
      </Text>
    </>
  );
}
