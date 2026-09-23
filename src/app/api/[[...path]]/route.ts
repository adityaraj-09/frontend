import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { upstreamAuthorization } from "@/lib/api/upstream-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

/** Next.js rejects a route-handler response that carries middleware rewrite headers. Clerk adds them on the backend. */
function forwardHeader(key: string): boolean {
  const lower = key.toLowerCase();
  return !HOP.has(lower) && !lower.startsWith("x-middleware-");
}

async function proxy(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const base = process.env.API_URL?.replace(/\/$/, "") || "http://localhost:4000";
  const incoming = new URL(request.url);
  const target = `${base}/api/${path.join("/")}${incoming.search}`;

  const { getToken } = await auth();
  const token = await getToken();

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (forwardHeader(key)) headers.set(key, value);
  });
  const authorization = upstreamAuthorization({
    path,
    incoming: request.headers.get("authorization"),
    sessionToken: token,
  });
  if (authorization) headers.set("authorization", authorization);
  else headers.delete("authorization");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (forwardHeader(key)) out.set(key, value);
  });
  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
