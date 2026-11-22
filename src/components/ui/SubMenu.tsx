import { type JSX, useContext } from "solid-js";
import MenuItem from "./MenuItem.tsx";
import { MenuPages } from "./MenuHost.tsx";

type Props = {
  label: string;
  icon?: JSX.Element;
  hint?: JSX.Element | string;
  disabled?: boolean;
  children: JSX.Element;
};

export default function SubMenu(props: Props) {
  const openPage = useContext(MenuPages);
  let row: HTMLButtonElement | undefined;

  const open = () =>
    openPage?.({
      title: props.label,
      content: () => props.children,
      opener: row,
    });

  return (
    <MenuItem
      ref={(el) => (row = el)}
      label={props.label}
      icon={props.icon}
      hint={props.hint}
      submenu
      disabled={props.disabled}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight") return;
        e.preventDefault();
        open();
      }}
    />
  );
}
