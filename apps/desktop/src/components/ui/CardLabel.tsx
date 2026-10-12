type Props = {
  children: string;
};

export default function CardLabel(props: Props) {
  return (
    <div class="px-5 pt-4 pb-1 text-small text-ink-faint">{props.children}</div>
  );
}
