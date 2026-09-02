const installed = Symbol.for("gumroad.browserTranslationGuard");
const getRemoveChild = (): typeof Node.prototype.removeChild => Reflect.get(Node.prototype, "removeChild");
const getInsertBefore = (): typeof Node.prototype.insertBefore => Reflect.get(Node.prototype, "insertBefore");

export default function installBrowserTranslationGuard() {
  if (typeof Node === "undefined") return;

  const originalRemoveChild = getRemoveChild();
  if (Reflect.has(originalRemoveChild, installed)) return;

  Node.prototype.removeChild = function <T extends Node>(child: T) {
    if (child.parentNode !== this) return child;
    originalRemoveChild.call(this, child);
    return child;
  };

  const originalInsertBefore = getInsertBefore();
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null) {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    originalInsertBefore.call(this, newNode, referenceNode);
    return newNode;
  };

  const guardedRemoveChild = getRemoveChild();
  Reflect.defineProperty(guardedRemoveChild, installed, { value: true });
}
