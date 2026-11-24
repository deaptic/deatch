type Props = {
  children: string;
};

export default function CardLabel(props: Props) {
  return (
    <div class="px-4 pt-3 pb-0.5 text-micro uppercase text-ink-faint">
      {props.children}
    </div>
  );
}
