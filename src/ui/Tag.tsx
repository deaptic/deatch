export default function Tag(props: { label: string }) {
  return (
    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#2d2d35] text-[#adadb8] border border-[#3d3d4a]">
      {props.label}
    </span>
  );
}
