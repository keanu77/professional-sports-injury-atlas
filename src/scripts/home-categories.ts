const MOBILE_CATEGORY_QUERY = "(max-width: 40rem)";
const CATEGORY_BY_HASH = new Map([
  ["#body-parts", "body-parts"],
  ["#sports", "sports"],
  ["#situations", "situations"],
  ["#video-types", "video-types"],
]);

export function initializeHomeCategories(root: HTMLElement): void {
  if (root.dataset.homeCategoriesReady) return;
  const controls = root.querySelector<HTMLElement>(
    "[data-home-category-controls]",
  );
  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-home-category-select]"),
  );
  const panels = Array.from(
    root.querySelectorAll<HTMLElement>("[data-home-category-panel]"),
  );
  const buttonIds = buttons.map((button) => button.dataset.homeCategorySelect);
  const panelIds = panels.map((panel) => panel.dataset.homeCategoryPanel);
  if (
    !controls ||
    buttonIds.some((id) => !id) ||
    new Set(buttonIds).size !== buttons.length ||
    new Set(panelIds).size !== panels.length ||
    buttonIds.length !== panelIds.length ||
    buttonIds.some((id) => !panelIds.includes(id)) ||
    buttons.some(
      (button) =>
        button.getAttribute("aria-controls") !==
        panels.find(
          (panel) =>
            panel.dataset.homeCategoryPanel ===
            button.dataset.homeCategorySelect,
        )?.id,
    )
  )
    return;

  const media = window.matchMedia(MOBILE_CATEGORY_QUERY);
  let active = "body-parts";
  const render = (): void => {
    controls.hidden = !media.matches;
    for (const button of buttons) {
      const selected = button.dataset.homeCategorySelect === active;
      button.setAttribute(
        "aria-expanded",
        String(media.matches ? selected : true),
      );
    }
    for (const panel of panels) {
      panel.hidden =
        media.matches && panel.dataset.homeCategoryPanel !== active;
    }
  };
  for (const button of buttons) {
    button.addEventListener("click", () => {
      active = button.dataset.homeCategorySelect ?? active;
      render();
    });
  }
  const revealHashTarget = (): void => {
    const hash = window.location.hash;
    const category = CATEGORY_BY_HASH.get(hash);
    if (!category) return;
    active = category;
    render();
    window.requestAnimationFrame(() => {
      root.querySelector<HTMLElement>(hash)?.scrollIntoView();
    });
  };
  media.addEventListener("change", render);
  window.addEventListener("hashchange", revealHashTarget);
  root.dataset.homeCategoriesReady = "true";
  if (CATEGORY_BY_HASH.has(window.location.hash)) revealHashTarget();
  else render();
}

if (typeof document !== "undefined") {
  document
    .querySelectorAll<HTMLElement>("[data-home-categories]")
    .forEach(initializeHomeCategories);
}
