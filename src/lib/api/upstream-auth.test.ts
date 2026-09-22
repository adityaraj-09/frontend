import { describe, expect, it } from "vitest";
import { upstreamAuthorization } from "./upstream-auth";

describe("upstreamAuthorization", () => {
  it("keeps an API key on public v1 routes even when a session exists", () => {
    expect(
      upstreamAuthorization({
        path: ["v1", "completions"],
        incoming: "Bearer gxk_live_abc",
        sessionToken: "clerk-jwt",
      }),
    ).toBe("Bearer gxk_live_abc");
  });

  it("keeps an API key on the MCP route", () => {
    expect(
      upstreamAuthorization({
        path: ["mcp"],
        incoming: "Bearer gxk_live_abc",
        sessionToken: "clerk-jwt",
      }),
    ).toBe("Bearer gxk_live_abc");
  });

  it("uses the session token for signed-in app routes", () => {
    expect(
      upstreamAuthorization({
        path: ["keys"],
        incoming: "Bearer gxk_live_abc",
        sessionToken: "clerk-jwt",
      }),
    ).toBe("Bearer clerk-jwt");
  });

  it("forwards the incoming header when nobody is signed in", () => {
    expect(
      upstreamAuthorization({
        path: ["v1", "chats"],
        incoming: "Bearer gxk_live_abc",
        sessionToken: null,
      }),
    ).toBe("Bearer gxk_live_abc");
  });
});
