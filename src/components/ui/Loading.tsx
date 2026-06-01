import loadingSrc from "../../assets/loading.webp";

type Props = { size?: number };

export default function Loading(props: Props) {
  const size = () => props.size ?? 48;
  return (
    <img
      src={loadingSrc}
      alt="Loading"
      width={size()}
      height={size()}
      class="block select-none"
      draggable={false}
    />
  );
}
