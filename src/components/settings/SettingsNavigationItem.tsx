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
          ? "bg-[#2d2d35] text-white"
          : "text-[#adadb8] hover:bg-[#2d2d35] hover:text-white"
      }`}
    >
      {props.label}
    </button>
  );
}
