type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export default function Toggle(props: Props) {
  return (
    <button
      onClick={() => props.onChange(!props.checked)}
      class={`relative shrink-0 w-8 h-4 rounded-full transition-colors cursor-pointer ${props.checked ? "bg-[#9146ff]" : "bg-[#3d3d4a]"}`}
    >
      <span
        class={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${props.checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}
