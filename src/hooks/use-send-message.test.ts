import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useComposerStore } from "@/stores/composer";
import { useRunSessionStore } from "@/stores/run-session";

const push = vi.fn();
const create = vi.fn();
const send = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/clerk", () => ({
  useUser: () => ({ isSignedIn: true }),
  useClerk: () => ({ openSignIn: vi.fn() }),
}));

const update = vi.fn();

vi.mock("@/lib/api/services", () => ({
  chatApi: {
    create: (...args: unknown[]) => create(...args),
    update: (...args: unknown[]) => update(...args),
  },
  messageApi: { send: (...args: unknown[]) => send(...args) },
}));

import { useSendMessage } from "./use-send-message";

const chatId = "332f7edf-6265-4fe4-98e7-1ef990920469";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe("useSendMessage", () => {
  afterEach(() => {
    push.mockReset();
    create.mockReset();
    update.mockReset();
    send.mockReset();
    useComposerStore.setState({
      text: "",
      planMode: false,
      attachmentIds: [],
      pendingFiles: [],
      draftChatId: null,
      error: null,
    });
    useRunSessionStore.setState({ active: null, pending: null, streamText: "" });
  });

  it("navigates to the new chat before the send request finishes", async () => {
    let finishSend: (value: {
      chatId: string;
      messageId: string;
      runId: string;
      triggerRunId: string;
    }) => void = () => undefined;
    create.mockResolvedValue({
      id: chatId,
      title: "explain this",
      isFavorite: false,
      lastMessageAt: "2026-09-22T10:00:00.000Z",
      lastMessageId: null,
      createdAt: "2026-09-22T10:00:00.000Z",
      updatedAt: "2026-09-22T10:00:00.000Z",
    });
    send.mockReturnValue(
      new Promise((resolve) => {
        finishSend = resolve;
      }),
    );
    useComposerStore.setState({
      text: "explain this",
      attachmentIds: ["11111111-1111-1111-1111-111111111111"],
      pendingFiles: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          name: "shot.png",
          mimeType: "image/png",
          previewUrl: "https://cdn.example/shot.png",
          progress: 100,
          status: "complete",
          attachmentId: "11111111-1111-1111-1111-111111111111",
        },
      ],
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useSendMessage(), { wrapper: wrap(client) });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/chat/${chatId}`));
    expect(send).toHaveBeenCalled();
    expect(useRunSessionStore.getState().pending?.chatId).toBe(chatId);
    expect(useRunSessionStore.getState().pending?.text).toBe("explain this");
    expect(useRunSessionStore.getState().pending?.attachments).toEqual([
      expect.objectContaining({
        id: "11111111-1111-1111-1111-111111111111",
        url: "https://cdn.example/shot.png",
        mimeType: "image/png",
      }),
    ]);
    expect(send).toHaveBeenCalledWith(
      chatId,
      expect.objectContaining({
        attachmentIds: ["11111111-1111-1111-1111-111111111111"],
      }),
    );

    await act(async () => {
      finishSend({
        chatId,
        messageId: "aaaaaaaa-1111-1111-1111-111111111111",
        runId: "bbbbbbbb-1111-1111-1111-111111111111",
        triggerRunId: "tr_1",
      });
    });
  });

  it("creates a new chat on the current project", async () => {
    const projectId = "4993369f-c375-4ee7-90d8-5ea27aa09d6b";
    create.mockResolvedValue({
      id: chatId,
      title: "from the project",
      isFavorite: false,
      projectId,
      lastMessageAt: "2026-09-23T10:00:00.000Z",
      lastMessageId: null,
      createdAt: "2026-09-23T10:00:00.000Z",
      updatedAt: "2026-09-23T10:00:00.000Z",
    });
    send.mockResolvedValue({
      chatId,
      messageId: "aaaaaaaa-1111-1111-1111-111111111111",
      runId: "bbbbbbbb-1111-1111-1111-111111111111",
    });
    useComposerStore.setState({ text: "from the project" });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useSendMessage(undefined, projectId), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(create).toHaveBeenCalledWith({ title: "from the project", projectId });
    expect(update).not.toHaveBeenCalled();
  });

  it("attaches an existing draft chat to the project", async () => {
    const projectId = "4993369f-c375-4ee7-90d8-5ea27aa09d6b";
    update.mockResolvedValue({ id: chatId, projectId });
    send.mockResolvedValue({
      chatId,
      messageId: "aaaaaaaa-1111-1111-1111-111111111111",
      runId: "bbbbbbbb-1111-1111-1111-111111111111",
    });
    useComposerStore.setState({ text: "continue draft", draftChatId: chatId });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useSendMessage(undefined, projectId), { wrapper: wrap(client) });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(chatId, { projectId });
  });
});
