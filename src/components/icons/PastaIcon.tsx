export default function PastaIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class={props.class}>
      <path d="M2 9 H14 V10 C14 12.5 11 14 8 14 C5 14 2 12.5 2 10 Z" stroke-linejoin="round" />
      <path d="M4 7.5 Q6 5.5 8 7 T12 6.5" stroke-linecap="round" />
      <path d="M4 5 Q6 3 8 4.5 T12 4" stroke-linecap="round" />
    </svg>
  );
}
