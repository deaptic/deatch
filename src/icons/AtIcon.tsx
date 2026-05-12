export default function AtIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class={props.class}>
      <circle cx="8" cy="8" r="2.5" />
      <path d="M10.5 5.5 V9 C10.5 10.4 12 10.4 12.5 9 C13 7.5 13 4 9.5 3 C5.5 2 2.5 5 2.5 8 C2.5 11 5 13.5 8.5 13.5 C10 13.5 11 13 11.5 12.5" stroke-linecap="round" />
    </svg>
  );
}
