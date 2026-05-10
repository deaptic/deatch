import type { JSX } from "solid-js";

type Props = {
  title?: string;
  children: JSX.Element;
};

export default function SettingsContent(props: Props) {
  return (
    <div class="flex-1 overflow-y-auto p-6">
      <section class="flex flex-col gap-8">
        {props.title && <h2 class="text-text text-lg font-semibold">{props.title}</h2>}
        {props.children}
      </section>
    </div>
  );
}
