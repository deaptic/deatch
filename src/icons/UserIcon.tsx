export default function UserIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class={props.class}>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 13 C3 10.5 5 9.5 8 9.5 S13 10.5 13 13" stroke-linecap="round" />
    </svg>
  );
}
