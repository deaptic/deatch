import { type JSX, Show } from "solid-js";

export default function EmotePickerSection(props: {
  id: string;
  label?: string;
  rows: number;
  empty?: string;
  children: JSX.Element;
}) {
  return (
    <section data-section-id={props.id}>
      <Show when={props.label}>
        <p class="sticky top-0 z-10 px-1 pt-2 pb-1.5 bg-overlay text-small text-ink-faint">
          {props.label}
        </p>
      </Show>
      <Show
        when={props.rows > 0 || !props.empty}
        fallback={
          <p class="px-1 pb-2 text-small text-ink-faint">{props.empty}</p>
        }
      >
        <div class="render-lazy" style={{ "--rows": props.rows }}>
          {props.children}
        </div>
      </Show>
    </section>
  );
}
