// Keep keyboard focus inside a modal, restore it to the trigger when it closes.
export function modalFocus(node: HTMLElement, close: () => void) {
  const previous = document.activeElement as HTMLElement | null;
  const selector =
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]';
  requestAnimationFrame(() =>
    (node.querySelector<HTMLElement>(selector) ?? node).focus(),
  );
  function keydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const elements = Array.from(
      node.querySelectorAll<HTMLElement>(selector),
    ).filter((e) => e.offsetParent !== null);
    const first = elements[0],
      last = elements.at(-1);
    if (!first) {
      event.preventDefault();
      node.focus();
      return;
    }
    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === node)
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  const oldOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  node.addEventListener("keydown", keydown);
  return {
    destroy() {
      node.removeEventListener("keydown", keydown);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    },
  };
}
