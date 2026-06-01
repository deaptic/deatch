export default function PinIcon(props: { class?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill={props.filled ? "currentColor" : "none"}
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <rect x="6" y="2" width="4" height="6" />
      <path d="M4 8 L12 8 M8 8 L8 15" />
    </svg>
  );
}
