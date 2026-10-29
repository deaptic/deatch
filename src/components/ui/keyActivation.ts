export function onActivateKey(activate: (x: number, y: number) => void) {
  return (e: KeyboardEvent & { currentTarget: HTMLElement }) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    activate(r.left, r.bottom);
  };
}
