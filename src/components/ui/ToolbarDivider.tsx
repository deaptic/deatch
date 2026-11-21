const HEIGHTS = {
  titleBar: "h-5",
  toolbar: "h-3.5",
};

export default function ToolbarDivider(props: { in: keyof typeof HEIGHTS }) {
  return (
    <div aria-hidden class={`w-px self-center mx-1 ${HEIGHTS[props.in]}`} />
  );
}
