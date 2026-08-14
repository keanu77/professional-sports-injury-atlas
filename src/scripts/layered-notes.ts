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
    const buttons = Array.from(
      block.querySelectorAll<HTMLButtonElement>("[data-layer-button]"),
    );
    const layers = Array.from(
      block.querySelectorAll<HTMLElement>("[data-layer]"),
    );
    if (buttons.length !== 2 || layers.length !== 2) continue;

    const generalButton = buttons.find(
      (button) => button.dataset.layerButton === "general",
    );
    const professionalButton = buttons.find(
      (button) => button.dataset.layerButton === "professional",
    );
    const generalLayer = layers.find(
      (layer) => layer.dataset.layer === "general",
    );
    const professionalLayer = layers.find(
      (layer) => layer.dataset.layer === "professional",
    );
    if (
      generalButton === undefined ||
      professionalButton === undefined ||
      generalLayer === undefined ||
      professionalLayer === undefined ||
      generalLayer.id === "" ||
      professionalLayer.id === "" ||
      generalButton.getAttribute("aria-controls") !== generalLayer.id ||
      professionalButton.getAttribute("aria-controls") !== professionalLayer.id
    ) {
      continue;
    }

    block.dataset.layeredNotesReady = "true";
    const activate = (layer: "general" | "professional"): void => {
      block.dataset.emphasis = layer;
      generalButton.setAttribute(
        "aria-pressed",
        layer === "general" ? "true" : "false",
      );
      professionalButton.setAttribute(
        "aria-pressed",
        layer === "professional" ? "true" : "false",
      );
    };
    for (const button of [generalButton, professionalButton]) {
      button.addEventListener("click", () => {
        const layer = button.dataset.layerButton;
        if (layer !== "general" && layer !== "professional") return;
        activate(layer);
      });
    }
  }
}
