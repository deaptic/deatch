export default function RestoreIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 10 10" class={props.class}>
      <path d="M2.5 0.5 H9.5 V7.5 M0.5 2.5 H7.5 V9.5 H0.5 Z" stroke="currentColor" stroke-width="1" fill="none" />
    </svg>
  );
}
