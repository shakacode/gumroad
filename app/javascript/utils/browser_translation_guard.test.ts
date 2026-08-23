// @vitest-environment happy-dom

import { afterEach, expect, test, vi } from "vitest";

const getRemoveChild = (): typeof Node.prototype.removeChild => Reflect.get(Node.prototype, "removeChild");
const getInsertBefore = (): typeof Node.prototype.insertBefore => Reflect.get(Node.prototype, "insertBefore");
const originalRemoveChild = getRemoveChild();
const originalInsertBefore = getInsertBefore();

afterEach(() => {
  Node.prototype.removeChild = originalRemoveChild;
  Node.prototype.insertBefore = originalInsertBefore;
  vi.resetModules();
});

test("guards translated nodes once across isolated module instances", async () => {
  const { default: installBrowserTranslationGuard } = await import("./browser_translation_guard");
  installBrowserTranslationGuard();

  const guardedRemoveChild = getRemoveChild();
  const guardedInsertBefore = getInsertBefore();

  vi.resetModules();
  const { default: installFreshBrowserTranslationGuard } = await import("./browser_translation_guard");
  installFreshBrowserTranslationGuard();

  expect(getRemoveChild()).toBe(guardedRemoveChild);
  expect(getInsertBefore()).toBe(guardedInsertBefore);

  const parent = document.createElement("div");
  const translatedParent = document.createElement("div");
  const translatedChild = document.createElement("span");
  translatedParent.appendChild(translatedChild);

  expect(parent.removeChild(translatedChild)).toBe(translatedChild);
  expect(translatedChild.parentNode).toBe(translatedParent);

  const newNode = document.createElement("span");
  expect(parent.insertBefore(newNode, translatedChild)).toBe(newNode);
  expect(newNode.parentNode).toBeNull();

  const existingChild = document.createElement("span");
  parent.appendChild(existingChild);
  expect(parent.removeChild(existingChild)).toBe(existingChild);
  expect(existingChild.parentNode).toBeNull();

  expect(parent.insertBefore(newNode, null)).toBe(newNode);
  expect(newNode.parentNode).toBe(parent);
});
