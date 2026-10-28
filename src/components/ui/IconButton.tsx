import { type JSX, splitProps } from "solid-js";
import Button, { type ButtonSize, type ButtonVariant } from "./Button.tsx";

type Props = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  pressed?: boolean;
  loading?: boolean;
  children: JSX.Element;
};

export default function IconButton(props: Props) {
  const [local, others] = splitProps(props, ["label", "variant", "children"]);
  return (
    <Button
      onMouseDown={(e) => e.preventDefault()}
      {...others}
      variant={local.variant ?? "ghost"}
      icon={local.children}
      aria-label={local.label}
      data-tip={local.label}
    />
  );
}
