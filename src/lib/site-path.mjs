export function publicAssetPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://127.0.0.1").pathname).replace(/^\/+/, "");
  if (!pathname) return "index.html";
  return pathname.endsWith("/") ? `${pathname}index.html` : pathname;
}
