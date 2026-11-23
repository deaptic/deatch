import {
  type Accessor,
  children,
  createContext,
  createEffect,
  type JSX,
  Show,
  useContext,
} from "solid-js";
import { createTransition } from "../shared/solid/createTransition.ts";
import { playExit } from "./playExit.ts";

type Props<T> = {
  when: T | undefined | null | false;
  children: (value: Accessor<NonNullable<T>>) => JSX.Element;
};

type ExitTarget = {
  register: (element: Element) => void;
  closing: Accessor<boolean>;
};

const ExitTargetContext = createContext<ExitTarget>();

export function createExitTarget(onClosing: () => void) {
  const target = useContext(ExitTargetContext);
  createEffect(() => {
    if (target?.closing()) onClosing();
  });
  return (element: Element) => target?.register(element);
}

export function ExitScope(props: { children: JSX.Element }) {
  return (
    <ExitTargetContext.Provider value={undefined}>
      {props.children}
    </ExitTargetContext.Provider>
  );
}

export default function Transition<T>(props: Props<T>) {
  let registered: Element | undefined;
  const presence = createTransition(
    () => props.when,
    () => playExit(element()),
  );
  const resolved = children(() => (
    <ExitTargetContext.Provider
      value={{
        register: (el) => (registered ??= el),
        closing: presence.closing,
      }}
    >
      <Show when={presence.value()}>{(value) => props.children(value)}</Show>
    </ExitTargetContext.Provider>
  ));
  const element = () =>
    resolved.toArray().find((n) => n instanceof Element) ?? registered;

  createEffect(() => {
    if (!presence.value()) registered = undefined;
    if (!presence.closing()) element()?.removeAttribute("data-closing");
  });

  return <>{resolved()}</>;
}
