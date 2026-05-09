export default function CloseIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 10 10" class={props.class}>
      <path d="M0 0 L10 10 M10 0 L0 10" stroke="currentColor" stroke-width="1" fill="none" />
    </svg>
  );
}
