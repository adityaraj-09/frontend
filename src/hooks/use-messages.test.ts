import { describe, expect, it } from "vitest";
import { applyPendingTurn, mergeLiveTools, preferAssistant, visibleWaitpoint } from "./use-messages";
import type { Message } from "@/lib/api/schemas";

describe("live snapshot merge", () => {
  it("keeps the assistant payload with more blocks so images appear as they land", () => {
    const live = {
      id: "aaaaaaaa-1111-1111-1111-111111111111",
      status: "STREAMING",
      contentBlocks: [
        { type: "text", text: "cropping" },
        { type: "asset", url: "https://cdn.example/out.png", mimeType: "image/png" },
      ],
    };
    const rest = {
      id: live.id,
      status: "STREAMING",
      contentBlocks: [{ type: "text", text: "cropping" }],
    };
    expect(preferAssistant(live, rest)?.contentBlocks).toHaveLength(2);
  });

  it("never surfaces a media waitpoint", () => {
    expect(
      visibleWaitpoint({
        waitpointId: "aaaaaaaa-1111-1111-1111-111111111111",
        type: "MEDIA",
        status: "WAITING",
        triggerWaitpointId: "tok",
        publicAccessToken: null,
        timeoutAt: "2099-01-01T00:00:00.000Z",
        payload: {},
      }),
    ).toBeNull();
  });

  it("merges live tool status onto persisted tools", () => {
    const merged = mergeLiveTools(
      [{ toolCallId: "call_1", toolName: "crop_image", status: "SUCCESS" }],
      [{ toolCallId: "call_1", toolName: "crop_image", status: "RUNNING" }],
    );
    expect(merged).toEqual([{ toolCallId: "call_1", toolName: "crop_image", status: "SUCCESS" }]);
  });
});

describe("applyPendingTurn", () => {
  const pending = {
    chatId: "11111111-1111-1111-1111-111111111111",
    text: "explain this image",
    userId: "aaaaaaaa-1111-1111-1111-111111111111",
    assistantId: "bbbbbbbb-1111-1111-1111-111111111111",
    createdAt: "2026-09-22T10:00:00.000Z",
  };

  it("injects the user bubble and a streaming assistant so Thinking… can show immediately", () => {
    const next = applyPendingTurn([], pending);
    expect(next.map((message) => message.role)).toEqual(["USER", "ASSISTANT"]);
    expect(next[1]?.status).toBe("STREAMING");
    expect(next[0]?.contentBlocks).toEqual([{ type: "text", text: "explain this image" }]);
  });

  it("does not duplicate when the server user message already landed", () => {
    const user: Message = {
      id: "cccccccc-1111-1111-1111-111111111111",
      chatId: pending.chatId,
      role: "USER",
      status: "SUCCESS",
      contentBlocks: [{ type: "text", text: "explain this image" }],
      createdAt: pending.createdAt,
      errorCode: null,
      errorMessage: null,
      attachments: [],
    };
    const next = applyPendingTurn([user], pending);
    expect(next.filter((message) => message.role === "USER")).toHaveLength(1);
    expect(next.some((message) => message.role === "ASSISTANT" && message.status === "STREAMING")).toBe(true);
  });
});
