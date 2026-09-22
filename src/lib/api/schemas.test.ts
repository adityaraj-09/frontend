import { describe, expect, it } from "vitest";
import { attachmentListSchema, contentBlockSchema, sendResponseSchema } from "./schemas";

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

describe("library attachments", () => {
  it("parses uploaded files that have no message status field", () => {
    const parsed = attachmentListSchema.parse({
      items: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          chatId: "22222222-2222-2222-2222-222222222222",
          origin: "UPLOAD",
          filename: "chart.png",
          mimeType: "image/png",
          byteSize: 2048,
          url: "https://cdn.example/chart.png",
          thumbnailUrl: null,
          width: 800,
          height: 600,
          durationMs: null,
          createdAt: "2026-09-22T10:00:00.000Z",
          expiresAt: null,
        },
      ],
      nextCursor: null,
    });
    expect(parsed.items[0]?.filename).toBe("chart.png");
    expect(parsed.items[0]?.url).toBe("https://cdn.example/chart.png");
  });
});
