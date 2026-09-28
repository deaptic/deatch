import { type JSX, splitProps } from "solid-js";
import Button, { type ButtonSize, type ButtonVariant } from "./Button.tsx";

type Props = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  variant?: Extract<ButtonVariant, "ghost" | "neutral">;
  size?: ButtonSize;
  pressed?: boolean;
  loading?: boolean;
  children: JSX.Element;
};

export default function IconButton(props: Props) {
  const [local, others] = splitProps(props, ["label", "variant", "children"]);
  return (
    <Button
      {...others}
      variant={local.variant ?? "ghost"}
      icon={local.children}
      aria-label={local.label}
      title={local.label}
    />
  );
}
