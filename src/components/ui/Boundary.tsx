import { ErrorBoundary, type JSX } from "solid-js";
import Button from "./Button.tsx";

type Props = {
  label?: string;
  children: JSX.Element;
};

export default function Boundary(props: Props) {
  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <div class="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <p class="text-title text-ink">
            {props.label ?? "Something went wrong"}
          </p>
          <p class="text-small text-ink-soft max-w-90 break-words">
            {err instanceof Error ? err.message : String(err)}
          </p>
          <Button variant="neutral" size="sm" class="mt-2" onClick={reset}>
            Try again
          </Button>
        </div>
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
}
