export default function CalendarIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class={props.class}>
      <rect x="2" y="3" width="12" height="11" rx="1" />
      <path d="M2 6h12 M5 1.5v3 M11 1.5v3" stroke-linecap="round" />
    </svg>
  );
}
