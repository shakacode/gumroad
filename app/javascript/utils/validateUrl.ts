// Rich content is rendered on Gumroad-owned domains. Block schemes that can execute code or read
// local resources, while retaining custom app schemes used for native-app deep links.
const BLOCKED_URL_SCHEMES = ["javascript", "data", "vbscript", "file", "blob"];
// Requiring `//` keeps a host with a port (`example.com:8080`) from looking like a custom scheme.
const SCHEME_WITH_AUTHORITY_REGEX = /^([a-z][a-z0-9+.-]*):\/\//iu;

export const validateUrl = (url?: string) => {
  if (!url) return false;

  url = url.trim();
  if (/^https?:?[/]{0,2}.*/iu.test(url)) url = url.replace(/^https?:?[/]{0,2}/iu, "https://");

  const schemeMatch = SCHEME_WITH_AUTHORITY_REGEX.exec(url);
  if (schemeMatch) {
    if (BLOCKED_URL_SCHEMES.includes((schemeMatch[1] ?? "").toLowerCase())) return false;
  } else {
    url = `https://${url}`;
  }

  try {
    return new URL(url).toString();
  } catch {
    return false;
  }
};
