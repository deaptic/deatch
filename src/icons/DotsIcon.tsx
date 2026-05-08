export default function DotsIcon(props: { class?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class={props.class}>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}
