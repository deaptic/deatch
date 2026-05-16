import PlusIcon from "../../icons/PlusIcon";

type Props = {
  onClick: () => void;
  ref?: (el: HTMLButtonElement) => void;
};

export default function MenuAddButton(props: Props) {
  return (
    <button
      ref={props.ref}
      onClick={props.onClick}
      title="Pin a channel"
      class="w-full flex items-center justify-center p-2 hover:bg-bg transition-colors cursor-pointer text-text-muted hover:text-text"
    >
      <div class="w-8 h-8 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
        <PlusIcon class="w-4 h-4" />
      </div>
    </button>
  );
}
