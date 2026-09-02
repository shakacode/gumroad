const CLIENT_RICH_TEXT_NODES = new Set(["codeBlock", "raw", "reviewCard", "upsellCard"]);

export const profileRichTextNeedsClientEnhancement = (node: unknown): boolean => {
  if (typeof node !== "object" || node === null) return false;
  if ("type" in node && typeof node.type === "string" && CLIENT_RICH_TEXT_NODES.has(node.type)) return true;
  return "content" in node && Array.isArray(node.content) && node.content.some(profileRichTextNeedsClientEnhancement);
};
