export default function ExternalLinkIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class={props.class}>
      <path
        d="M9 1H15V7 M15 1L7 9 M11 8V15H1V4H8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
