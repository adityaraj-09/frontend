import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRunSessionStore } from "@/stores/run-session";

const subscribe = vi.fn((..._args: unknown[]) => ({
  run: undefined,
  streams: {},
  error: undefined,
}));

vi.mock("@trigger.dev/react-hooks", () => ({
  useRealtimeRunWithStreams: (...args: unknown[]) => subscribe(...args),
}));

const snapshot = vi.fn();

vi.mock("@/lib/api/services", () => ({
  runApi: { snapshot: (...args: unknown[]) => snapshot(...args) },
}));

import { joinAssistantStream, liveStreamForTurn, useRunRealtime } from "./use-run-realtime";

const chatId = "11111111-1111-1111-1111-111111111111";
const runId = "22222222-2222-2222-2222-222222222222";
const messageId = "33333333-3333-3333-3333-333333333333";

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe("joinAssistantStream", () => {
  it("joins Trigger text chunks in arrival order", () => {
    expect(
      joinAssistantStream([{ type: "text", text: "Hel" }, { text: "lo" }, "!", { chunk: { text: " there" } }]),
    ).toBe("Hello! there");
  });
});

describe("liveStreamForTurn", () => {
  it("shows tokens on the live assistant even before ids match", () => {
    expect(
      liveStreamForTurn({
        lastAssistant: { id: "pending", status: "STREAMING" },
        assistantMessageId: null,
        status: "THINKING",
        streamText: "Hello",
      }),
    ).toBe("Hello");
  });

  it("hides leftover tokens after the turn is done", () => {
    expect(
      liveStreamForTurn({
        lastAssistant: { id: "done", status: "SUCCESS" },
        assistantMessageId: "other",
        status: "COMPLETE",
        streamText: "Hello",
      }),
    ).toBe("");
  });
});

describe("useRunRealtime", () => {
  afterEach(() => {
    subscribe.mockClear();
    snapshot.mockReset();
    useRunSessionStore.setState({ active: null, pending: null, streamText: "" });
  });

  it("subscribes to Trigger with the snapshot run id and token", async () => {
    snapshot.mockResolvedValue({
      chatId,
      runId,
      messageId,
      assistantMessageId: null,
      status: "THINKING",
      currentStep: "thinking",
      thinkingDurationMs: null,
      progressPercent: 10,
      tools: [],
      waitpoint: null,
      errorCode: null,
      errorMessage: null,
      triggerRunId: "run_live_1",
      assistant: null,
      realtimeToken: "pat_live",
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useRunRealtime(chatId, runId), { wrapper: wrap(client) });

    await waitFor(() => {
      expect(subscribe).toHaveBeenCalledWith(
        "run_live_1",
        expect.objectContaining({ accessToken: "pat_live", enabled: true }),
      );
    });
  });

  it("keeps an existing live token when later snapshots mint a new one", async () => {
    useRunSessionStore.setState({
      active: {
        chatId,
        runId,
        triggerRunId: "run_live_1",
        realtimeToken: "pat_first",
        messageId,
      },
      pending: null,
      streamText: "Hel",
    });
    snapshot.mockResolvedValue({
      chatId,
      runId,
      messageId,
      assistantMessageId: null,
      status: "THINKING",
      currentStep: "thinking",
      thinkingDurationMs: null,
      progressPercent: 10,
      tools: [],
      waitpoint: null,
      errorCode: null,
      errorMessage: null,
      triggerRunId: "run_live_1",
      assistant: null,
      realtimeToken: "pat_second",
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useRunRealtime(chatId, runId), { wrapper: wrap(client) });

    await waitFor(() => expect(snapshot).toHaveBeenCalled());
    expect(useRunSessionStore.getState().streamText).toBe("Hel");
    expect(useRunSessionStore.getState().active?.realtimeToken).toBe("pat_first");
    expect(subscribe).toHaveBeenCalledWith(
      "run_live_1",
      expect.objectContaining({ accessToken: "pat_first", enabled: true }),
    );
  });
});

describe("patchActive", () => {
  it("fills in Trigger credentials without wiping streamed text", () => {
    useRunSessionStore.setState({
      active: {
        chatId,
        runId,
        triggerRunId: null,
        messageId,
      },
      streamText: "Hel",
    });
    act(() => {
      useRunSessionStore.getState().patchActive({
        chatId,
        runId,
        triggerRunId: "run_live_1",
        realtimeToken: "pat_live",
        messageId,
      });
    });
    expect(useRunSessionStore.getState().streamText).toBe("Hel");
    expect(useRunSessionStore.getState().active?.triggerRunId).toBe("run_live_1");
  });
});
