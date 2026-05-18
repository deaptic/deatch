export default function LogoutIcon(props: { class?: string }) {
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
      <path d="M6 14 H3 V2 H6" />
      <path d="M11 5 L14 8 L11 11" />
      <path d="M6 8 H14" />
    </svg>
  );
}
