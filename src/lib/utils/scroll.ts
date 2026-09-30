/// Scrolls a rendered message into view and briefly highlights it. Relies
/// on FeedMessage rendering a `data-message-id` attribute on each row.
export function scrollToMessage(messageId: string) {
  const el = document.querySelector(`[data-message-id="${messageId}"]`) as
    | HTMLElement
    | null;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.backgroundColor =
    "color-mix(in oklab, var(--color-accent) 30%, transparent)";
  const clear = () => {
    el.style.transition = "background-color var(--duration-settle) ease";
    el.style.backgroundColor = "";
    el.removeEventListener("mouseenter", clear);
  };
  el.addEventListener("mouseenter", clear);
}
