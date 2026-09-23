"use client";

import { useRealtimeRunWithStreams, useRealtimeStream } from "@trigger.dev/react-hooks";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { runApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import { runSnapshotSchema, type RunSnapshot } from "@/lib/api/schemas";
import { mergeLiveTools, parseBlocks, preferAssistant, visibleWaitpoint } from "@/hooks/use-messages";
import { isActiveRun, preferRunStatus } from "@/lib/format";
import { useRunSessionStore } from "@/stores/run-session";

type TextChunk = { type?: string; text?: string; chunk?: unknown };

export function joinAssistantStream(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  return parts.map(chunkText).join("");
}

export function liveStreamForTurn(input: {
  lastAssistant?: { id: string; status: string } | null;
  assistantMessageId?: string | null;
  status?: string | null;
  streamText: string;
}): string {
  if (!input.streamText || !input.lastAssistant) return "";
  if (input.lastAssistant.status === "STREAMING") return input.streamText;
  if (input.assistantMessageId === input.lastAssistant.id) return input.streamText;
  if (isActiveRun(input.status)) return input.streamText;
  return "";
}

function chunkText(part: unknown): string {
  if (typeof part === "string") return part;
  if (!part || typeof part !== "object") return "";
  const record = part as TextChunk;
  if (typeof record.text === "string") return record.text;
  if (typeof record.chunk === "string") return record.chunk;
  if (record.chunk && typeof record.chunk === "object" && typeof (record.chunk as { text?: unknown }).text === "string") {
    return (record.chunk as { text: string }).text;
  }
  return "";
}

export function useRunRealtime(chatId: string | undefined, seedRunId?: string) {
  const active = useRunSessionStore((s) => s.active);
  const setActive = useRunSessionStore((s) => s.setActive);
  const patchActive = useRunSessionStore((s) => s.patchActive);
  const setStreamText = useRunSessionStore((s) => s.setStreamText);
  const streamText = useRunSessionStore((s) => s.streamText);

  const runId = active && active.chatId === chatId ? active.runId : seedRunId;
  const sessionTriggerId = active && active.chatId === chatId ? active.triggerRunId : null;
  const sessionToken = active && active.chatId === chatId ? active.realtimeToken : undefined;

  const snapshotQuery = useQuery({
    queryKey: queryKeys.run(chatId ?? "", runId ?? ""),
    queryFn: () => runApi.snapshot(chatId!, runId!),
    enabled: Boolean(chatId && runId),
    refetchInterval: (query) => {
      if (!isActiveRun(query.state.data?.status)) return false;
      return sessionTriggerId && sessionToken ? 4000 : 800;
    },
  });

  const triggerRunId = sessionTriggerId ?? snapshotQuery.data?.triggerRunId ?? null;
  const token = sessionToken ?? snapshotQuery.data?.realtimeToken;
  const liveEnabled = Boolean(triggerRunId && token);

  const realtime = useRealtimeRunWithStreams(triggerRunId ?? undefined, {
    accessToken: token,
    enabled: liveEnabled,
    baseURL: process.env.NEXT_PUBLIC_TRIGGER_API_URL || undefined,
  });
  const assistantStream = useRealtimeStream<{ type?: string; text?: string }>(
    triggerRunId ?? "",
    "assistant-text",
    {
      accessToken: token,
      enabled: liveEnabled,
      timeoutInSeconds: 600,
      throttleInMs: 16,
      baseURL: process.env.NEXT_PUBLIC_TRIGGER_API_URL || undefined,
    },
  );

  const liveMetadata = useMemo(() => {
    const meta = (realtime.run as { metadata?: unknown } | undefined)?.metadata;
    const parsed = runSnapshotSchema.partial().safeParse(meta);
    return parsed.success ? parsed.data : undefined;
  }, [realtime.run]);

  useEffect(() => {
    const fromStream = joinAssistantStream(assistantStream.parts);
    const fromLegacy = joinAssistantStream(
      (realtime.streams as Record<string, unknown> | undefined)?.["assistant-text"],
    );
    const joined = fromStream || fromLegacy;
    if (!joined) return;
    setStreamText(joined);
  }, [assistantStream.parts, realtime.streams, setStreamText]);

  const status = preferRunStatus(liveMetadata?.status, snapshotQuery.data?.status);

  useEffect(() => {
    if (status && !isActiveRun(status) && active?.chatId === chatId) {
      setActive(null);
    }
  }, [status, active?.chatId, chatId, setActive]);

  useEffect(() => {
    const snap = snapshotQuery.data;
    if (!snap || !isActiveRun(snap.status) || !chatId) return;
    const current = useRunSessionStore.getState().active;
    const sameRun = current?.chatId === chatId && current.runId === snap.runId;
    if (sameRun && current.triggerRunId && current.realtimeToken) return;
    if (!snap.triggerRunId && !snap.realtimeToken && sameRun) return;
    patchActive({
      chatId: snap.chatId,
      runId: snap.runId,
      triggerRunId: snap.triggerRunId ?? current?.triggerRunId ?? null,
      realtimeToken: current?.realtimeToken ?? snap.realtimeToken,
      messageId: snap.messageId,
    });
  }, [snapshotQuery.data, chatId, patchActive]);

  const snapshot: Partial<RunSnapshot> | undefined = useMemo(() => {
    const rest = snapshotQuery.data;
    if (!rest && !liveMetadata) return undefined;
    return {
      ...rest,
      ...liveMetadata,
      status: status ?? rest?.status ?? liveMetadata?.status ?? undefined,
      assistant: preferAssistant(liveMetadata?.assistant, rest?.assistant),
      tools: mergeLiveTools(liveMetadata?.tools, rest?.tools),
      waitpoint: visibleWaitpoint(
        liveMetadata && "waitpoint" in liveMetadata ? liveMetadata.waitpoint : (rest?.waitpoint ?? null),
      ),
    };
  }, [liveMetadata, snapshotQuery.data, status]);

  const heldSnapshot = useRef<Partial<RunSnapshot> | undefined>(undefined);
  useEffect(() => {
    heldSnapshot.current = undefined;
  }, [chatId]);
  if (snapshot) heldSnapshot.current = snapshot;
  const view = snapshot ?? heldSnapshot.current;
  const realtimeFailed = Boolean(realtime.error);

  return {
    snapshot: view,
    streamText: streamText || textFromAssistant(view?.assistant),
    isLive: liveEnabled && !realtimeFailed,
    isPolling: !liveEnabled || realtimeFailed,
    error: realtime.error,
    refetch: snapshotQuery.refetch,
  };
}

function textFromAssistant(assistant?: { contentBlocks?: unknown[] } | null): string {
  if (!assistant?.contentBlocks?.length) return "";
  return parseBlocks(assistant.contentBlocks)
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}
