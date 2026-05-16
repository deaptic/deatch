type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export default function SettingsNavigationItem(props: Props) {
  return (
    <button
      onClick={props.onClick}
      class={`text-left text-xs px-3 py-2 rounded transition-colors cursor-pointer ${
        props.active
          ? "bg-highlight text-text"
          : "text-text-muted hover:bg-bg hover:text-text"
      }`}
    >
      {props.label}
    </button>
  );
}
