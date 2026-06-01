import { ErrorBoundary, type JSX } from "solid-js";

type Props = {
  label?: string;
  children: JSX.Element;
}

export default function Boundary(props: Props) {
  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <div class="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <p class="text-text text-sm font-semibold">
            {props.label ?? "Something went wrong"}
          </p>
          <p class="text-text-muted text-xs max-w-xs break-words">
            {err instanceof Error ? err.message : String(err)}
          </p>
          <button
            type="button"
            onClick={reset}
            class="mt-1 text-xs text-primary hover:underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
}
