import SectionLabel from "./SectionLabel.tsx";

type Props = {
  children: string;
};

export default function CardLabel(props: Props) {
  return (
    <div class="px-4 pt-3 pb-0.5">
      <SectionLabel>{props.children}</SectionLabel>
    </div>
  );
}
