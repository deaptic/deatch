export default function Hook(props: { class: string }) {
  return (
    <span
      class={`absolute top-1/2 left-1/2 -ml-px h-feed-hook border-l-2 border-t-2 border-ink-faint rounded-tl-sm ${props.class}`}
    />
  );
}
