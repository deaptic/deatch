import type { JSX } from "solid-js";
import Text from "../../../kit/Text.tsx";

type Props = {
  title: string;
  children: JSX.Element;
};

export default function Section(props: Props) {
  return (
    <section class="flex flex-col gap-2">
      <Text as="h3" size="sm" tone="primary">
        {props.title}
      </Text>
      {props.children}
    </section>
  );
}
