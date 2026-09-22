import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatRow } from "./chat-row";
import type { Chat } from "@/lib/api/schemas";

const update = vi.fn(async (id: string, body: { isFavorite?: boolean }) => ({
  id,
  ...body,
}));

vi.mock("@/lib/api/services", () => ({
  chatApi: {
    update: (...args: unknown[]) => update(...(args as [string, { isFavorite?: boolean }])),
  },
}));

const chat: Chat = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Crop golden retriever",
  isFavorite: false,
  lastMessageAt: "2026-09-21T10:00:00.000Z",
  lastMessageId: null,
  createdAt: "2026-09-21T10:00:00.000Z",
  updatedAt: "2026-09-21T10:00:00.000Z",
};

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("ChatRow", () => {
  it("pins a chat", async () => {
    render(wrap(<ChatRow chat={chat} />));
    await userEvent.click(screen.getByRole("button", { name: "Pin chat" }));
    expect(update).toHaveBeenCalledWith(chat.id, { isFavorite: true });
  });
});
