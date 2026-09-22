const API_KEY_PREFIX = "gxk_live_";

/** Keep a caller-supplied API key on /api/v1 and /api/mcp. Session tokens stay on the signed-in app routes. */
export function upstreamAuthorization(input: {
  path: string[];
  incoming: string | null;
  sessionToken: string | null;
}): string | null {
  const keepsApiKey = input.path[0] === "v1" || input.path[0] === "mcp";
  const match = input.incoming ? /^Bearer\s+(\S+)$/i.exec(input.incoming.trim()) : null;
  if (keepsApiKey && match?.[1]?.startsWith(API_KEY_PREFIX)) {
    return `Bearer ${match[1]}`;
  }
  if (input.sessionToken) return `Bearer ${input.sessionToken}`;
  return input.incoming;
}
