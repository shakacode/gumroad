let installed = false;

export default function installBrowserTranslationGuard() {
  if (typeof Node === "undefined" || installed) return;

  // Translation extensions can relocate DOM nodes outside React's tree between renders.
  installed = true;
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T) {
    if (child.parentNode !== this) return child;

    originalRemoveChild.call(this, child);
    return child;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null) {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;

    originalInsertBefore.call(this, newNode, referenceNode);
    return newNode;
  };
}
