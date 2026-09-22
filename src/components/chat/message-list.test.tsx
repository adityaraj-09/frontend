import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { MessageList } from "./message-list";
import type { Message } from "@/lib/api/schemas";

beforeAll(() => {
  for (const [prop, value] of [
    ["offsetHeight", 640],
    ["offsetWidth", 760],
    ["clientHeight", 640],
    ["clientWidth", 760],
  ] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get() {
        return value;
      },
    });
  }
});

function msg(id: string, role: "USER" | "ASSISTANT", text: string): Message {
  return {
    id,
    chatId: "11111111-1111-1111-1111-111111111111",
    role,
    status: "COMPLETED",
    contentBlocks: [{ type: "text", text }],
    createdAt: "2026-09-21T10:00:00.000Z",
    errorCode: null,
    errorMessage: null,
    attachments: [],
  };
}

describe("MessageList", () => {
  it("virtualizes turns so the latest messages still render", () => {
    const messages = Array.from({ length: 40 }, (_, index) =>
      msg(
        `${index.toString().padStart(8, "0")}-1111-1111-1111-111111111111`,
        index % 2 === 0 ? "USER" : "ASSISTANT",
        `Turn ${index}`,
      ),
    );
    render(
      <div style={{ height: 640 }}>
        <MessageList messages={messages} streamText="" hasEarlier />
      </div>,
    );
    expect(screen.getByRole("button", { name: "Load earlier messages" })).toBeInTheDocument();
    expect(screen.getByText("Turn 0")).toBeInTheDocument();
    expect(screen.queryByText("Turn 39")).not.toBeInTheDocument();
  });
});
