/**
 * Layered-notes emphasis toggle. The native button group only moves visual
 * emphasis between the general and professional sections: it updates
 * `aria-pressed` (exactly one true), never hides either controlled section,
 * and never moves keyboard focus. Without JavaScript both sections stay
 * normally ordered and readable; this is not a tab interface.
 */

export function initLayeredNotes(root: ParentNode = document): void {
  const blocks = root.querySelectorAll<HTMLElement>("[data-layered-notes]");
  for (const block of blocks) {
    if (block.dataset.layeredNotesReady === "true") continue;
    block.dataset.layeredNotesReady = "true";
    const buttons = block.querySelectorAll<HTMLButtonElement>(
      "[data-layer-button]",
    );
    for (const button of buttons) {
      button.addEventListener("click", () => {
        const layer = button.dataset.layerButton;
        if (layer === undefined || layer === "") return;
        block.dataset.emphasis = layer;
        for (const candidate of buttons) {
          candidate.setAttribute(
            "aria-pressed",
            candidate === button ? "true" : "false",
          );
        }
      });
    }
  }
}
