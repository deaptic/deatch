export default function CloseIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class={props.class}>
      <path d="M0 0 L16 16 M16 0 L0 16" stroke-linecap="round" />
    </svg>
  );
}
