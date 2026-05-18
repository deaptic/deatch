export default function PaletteIcon(props: { class?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <path d="M8 1.5 C4 1.5 1.5 4.2 1.5 8 c0 3.5 3 6.5 6.5 6.5 1 0 1.5-0.7 1.5-1.5 0-0.5-0.2-0.8-0.5-1.1 -0.3-0.3-0.5-0.6-0.5-1.1 0-0.8 0.7-1.5 1.5-1.5 h1.5 c1.7 0 3-1.3 3-3 0-3.5-3-5.8-6.5-5.8z" />
      <circle cx="5" cy="6" r="0.6" fill="currentColor" />
      <circle cx="8" cy="4.2" r="0.6" fill="currentColor" />
      <circle cx="11" cy="6" r="0.6" fill="currentColor" />
    </svg>
  );
}
