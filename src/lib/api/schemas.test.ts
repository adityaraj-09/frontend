import { describe, expect, it } from "vitest";
import { contentBlockSchema, sendResponseSchema } from "./schemas";

describe("content blocks", () => {
  it("parses Magica asset and tool cards", () => {
    expect(contentBlockSchema.parse({ type: "text", text: "hello" }).type).toBe("text");
    expect(
      contentBlockSchema.parse({
        type: "asset",
        url: "https://cdn.example/out.png",
        mimeType: "image/png",
      }),
    ).toMatchObject({ type: "asset" });
  });
});

describe("send response", () => {
  it("accepts queued send", () => {
    const parsed = sendResponseSchema.parse({
      chatId: "11111111-1111-1111-1111-111111111111",
      messageId: "22222222-2222-2222-2222-222222222222",
      runId: "33333333-3333-3333-3333-333333333333",
      triggerRunId: "run_abc",
      realtimeToken: "tok",
    });
    expect(parsed.runId).toBe("33333333-3333-3333-3333-333333333333");
  });
});
