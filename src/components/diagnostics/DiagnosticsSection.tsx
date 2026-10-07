import type { JSX } from "solid-js";

type Props = {
  title: string;
  children: JSX.Element;
};

export default function DiagnosticsSection(props: Props) {
  return (
    <section class="flex flex-col gap-2">
      <h3 class="text-small text-ink">{props.title}</h3>
      {props.children}
    </section>
  );
}
