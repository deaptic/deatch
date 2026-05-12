export default function MuteIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class={props.class}>
      <path d="M3 6 H5 L8.5 3 V13 L5 10 H3 Z" stroke-linejoin="round" />
      <path d="M11 6 L14 9 M14 6 L11 9" stroke-linecap="round" />
    </svg>
  );
}
