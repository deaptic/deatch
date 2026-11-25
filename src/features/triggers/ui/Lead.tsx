import type { JSX } from "solid-js";
import Text from "../../../kit/Text.tsx";

export default function Lead(props: { children: JSX.Element }) {
  return (
    <Text
      size="sm"
      bold
      tone="soft"
      class="w-12 shrink-0 h-control-md flex items-center"
    >
      {props.children}
    </Text>
  );
}
