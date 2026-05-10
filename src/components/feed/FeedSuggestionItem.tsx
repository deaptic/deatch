import type { JSX } from "solid-js";

type Props = {
  active: boolean;
  onClick: () => void;
  children: JSX.Element;
};

export default function FeedSuggestionItem(props: Props) {
  return (
    <button
      onClick={props.onClick}
      class={`w-full flex items-center gap-3 px-3 py-1.5 text-sm cursor-pointer transition-colors ${
        props.active ? "bg-[#9146ff33]" : "hover:bg-[#2d2d35]"
      }`}
    >
      {props.children}
    </button>
  );
}
