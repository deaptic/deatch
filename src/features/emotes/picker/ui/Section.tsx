import { type JSX, Show } from "solid-js";
import Text from "../../../../kit/Text.tsx";

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
        <p class="sticky top-0 z-10 px-1 pt-2 pb-1.5 bg-overlay text-sm text-ink-faint">
          {props.label}
        </p>
      </Show>
      <Show
        when={props.rows > 0 || !props.empty}
        fallback={
          <div class="px-1 pb-2">
            <Text as="p" size="sm" tone="faint">
              {props.empty}
            </Text>
          </div>
        }
      >
        <div class="render-lazy" style={{ "--rows": props.rows }}>
          {props.children}
        </div>
      </Show>
    </section>
  );
}
