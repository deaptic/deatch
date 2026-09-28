import type { JSX } from "solid-js";

type Props = {
  children: JSX.Element;
};

export default function Card(props: Props) {
  return (
    <section class="bg-surface rounded-lg border border-transparent [[data-theme=light]_&]:border-line-soft">
      {props.children}
    </section>
  );
}
