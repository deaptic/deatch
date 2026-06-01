export default function SquareIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 10 10" class={props.class}>
      <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" stroke-width="1" fill="none" />
    </svg>
  );
}
