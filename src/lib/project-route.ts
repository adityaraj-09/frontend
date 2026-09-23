export function projectIdFromLocation(
  pathname = typeof window === "undefined" ? "" : window.location.pathname,
  search = typeof window === "undefined" ? "" : window.location.search,
): string | undefined {
  const fromQuery = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("projectId");
  const fromPath = pathname.match(/^\/projects\/([0-9a-f-]{36})/i)?.[1];
  const id = fromQuery || fromPath;
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id : undefined;
}

export function resolveProjectId(explicit?: string): string | undefined {
  if (explicit && /^[0-9a-f-]{36}$/i.test(explicit)) return explicit;
  return projectIdFromLocation();
}
