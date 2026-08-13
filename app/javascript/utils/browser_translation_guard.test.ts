// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

const originalRemoveChild = Node.prototype.removeChild;
const originalInsertBefore = Node.prototype.insertBefore;

afterEach(() => {
  Node.prototype.removeChild = originalRemoveChild;
  Node.prototype.insertBefore = originalInsertBefore;
  vi.resetModules();
});

describe("installBrowserTranslationGuard", () => {
  it("ignores node mutations made by browser translation and installs once", async () => {
    const { default: installBrowserTranslationGuard } = await import("$app/utils/browser_translation_guard");
    installBrowserTranslationGuard();
    const guardedRemoveChild = Node.prototype.removeChild;
    const guardedInsertBefore = Node.prototype.insertBefore;

    installBrowserTranslationGuard();

    expect(Node.prototype.removeChild).toBe(guardedRemoveChild);
    expect(Node.prototype.insertBefore).toBe(guardedInsertBefore);

    const parent = document.createElement("div");
    const translatedParent = document.createElement("div");
    const child = document.createElement("span");
    const reference = document.createElement("span");
    translatedParent.append(child, reference);

    expect(parent.removeChild(child)).toBe(child);
    expect(parent.insertBefore(child, reference)).toBe(child);
  });
});
