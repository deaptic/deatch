import EmptyState from "../../kit/EmptyState.tsx";

export default function CardEmpty(props: { body: string }) {
  return (
    <div class="px-2.5">
      <EmptyState variant="list" body={props.body} />
    </div>
  );
}
