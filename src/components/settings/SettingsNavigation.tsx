import type { JSX } from "solid-js";

type Props = {
  children: JSX.Element;
};

export default function SettingsNavigation(props: Props) {
  return (
    <nav class="w-48 shrink-0 border-r border-[#2d2d35] bg-[#18181b] py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
      {props.children}
    </nav>
  );
}
