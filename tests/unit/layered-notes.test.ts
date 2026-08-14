import { describe, expect, it } from "vitest";

import { initLayeredNotes } from "../../src/scripts/layered-notes";

class FakeButton {
  readonly dataset: Record<string, string>;
  readonly attributes = new Map<string, string>();
  private clickHandler: (() => void) | null = null;

  constructor(layer: "general" | "professional", controls: string) {
    this.dataset = { layerButton: layer };
    this.attributes.set("aria-controls", controls);
    this.attributes.set("aria-pressed", layer === "general" ? "true" : "false");
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  addEventListener(type: string, handler: () => void): void {
    if (type === "click") this.clickHandler = handler;
  }

  click(): void {
    this.clickHandler?.();
  }
}

class FakeLayer {
  readonly dataset: Record<string, string>;

  constructor(
    readonly id: string,
    layer: "general" | "professional",
  ) {
    this.dataset = { layer };
  }
}

class FakeBlock {
  readonly dataset: Record<string, string> = { emphasis: "general" };

  constructor(
    private readonly buttons: FakeButton[],
    private readonly layers: FakeLayer[],
  ) {}

  querySelectorAll(selector: string): unknown[] {
    if (selector === "[data-layer-button]") return this.buttons;
    if (selector === "[data-layer]") return this.layers;
    return [];
  }
}

function fakeRoot(block: FakeBlock): ParentNode {
  return {
    querySelectorAll: (selector: string) =>
      selector === "[data-layered-notes]" ? [block] : [],
  } as unknown as ParentNode;
}

function validFixture(): {
  block: FakeBlock;
  generalButton: FakeButton;
  professionalButton: FakeButton;
} {
  const generalButton = new FakeButton("general", "case-general-notes");
  const professionalButton = new FakeButton(
    "professional",
    "case-professional-notes",
  );
  const block = new FakeBlock(
    [generalButton, professionalButton],
    [
      new FakeLayer("case-general-notes", "general"),
      new FakeLayer("case-professional-notes", "professional"),
    ],
  );
  return { block, generalButton, professionalButton };
}

describe("initLayeredNotes", () => {
  it("wires exactly one reader and professional control without hiding either layer", () => {
    const { block, generalButton, professionalButton } = validFixture();

    initLayeredNotes(fakeRoot(block));
    expect(block.dataset.layeredNotesReady).toBe("true");

    professionalButton.click();
    expect(block.dataset.emphasis).toBe("professional");
    expect(generalButton.getAttribute("aria-pressed")).toBe("false");
    expect(professionalButton.getAttribute("aria-pressed")).toBe("true");

    generalButton.click();
    expect(block.dataset.emphasis).toBe("general");
    expect(generalButton.getAttribute("aria-pressed")).toBe("true");
    expect(professionalButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("fails closed when an obsolete or duplicate control remains", () => {
    const { block, generalButton } = validFixture();
    const invalidBlock = new FakeBlock(
      [
        generalButton,
        new FakeButton("professional", "case-professional-notes"),
        new FakeButton("general", "obsolete-notes"),
      ],
      [
        new FakeLayer("case-general-notes", "general"),
        new FakeLayer("case-professional-notes", "professional"),
      ],
    );

    initLayeredNotes(fakeRoot(invalidBlock));
    expect(invalidBlock.dataset.layeredNotesReady).toBeUndefined();
    generalButton.click();
    expect(invalidBlock.dataset.emphasis).toBe("general");
    expect(block.dataset.layeredNotesReady).toBeUndefined();
  });

  it("fails closed when aria-controls does not identify the expected target", () => {
    const generalButton = new FakeButton("general", "wrong-id");
    const professionalButton = new FakeButton(
      "professional",
      "case-professional-notes",
    );
    const block = new FakeBlock(
      [generalButton, professionalButton],
      [
        new FakeLayer("case-general-notes", "general"),
        new FakeLayer("case-professional-notes", "professional"),
      ],
    );

    initLayeredNotes(fakeRoot(block));
    expect(block.dataset.layeredNotesReady).toBeUndefined();
    professionalButton.click();
    expect(block.dataset.emphasis).toBe("general");
  });
});
