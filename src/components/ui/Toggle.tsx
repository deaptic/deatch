type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export default function Toggle(props: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      aria-label={props.label}
      disabled={props.disabled}
      onClick={() => props.onChange(!props.checked)}
      class={`relative shrink-0 w-10 h-5.5 rounded-full cursor-pointer transition-colors duration-quick disabled:opacity-40 disabled:cursor-not-allowed ${
        props.checked ? "bg-accent" : "bg-line"
      }`}
    >
      <span
        class={`absolute top-0.5 left-0.5 size-4.5 rounded-full transition duration-quick ease-out ${
          props.checked ? "translate-x-4.5 bg-on-accent" : "bg-ink-soft"
        }`}
      />
    </button>
  );
}
