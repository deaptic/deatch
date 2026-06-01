export default function HashIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class={props.class}>
      <path d="M5 2v12 M11 2v12 M2 5h12 M2 11h12" stroke-linecap="round" />
    </svg>
  );
}
