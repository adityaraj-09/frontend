"use client";

import { useRealtimeRunWithStreams } from "@trigger.dev/react-hooks";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { runApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import { runSnapshotSchema, type RunSnapshot } from "@/lib/api/schemas";
import { mergeLiveTools, preferAssistant, visibleWaitpoint } from "@/hooks/use-messages";
import { isActiveRun, preferRunStatus } from "@/lib/format";
import { useRunSessionStore } from "@/stores/run-session";

type TextChunk = { type?: string; text?: string };

export function useRunRealtime(chatId: string | undefined, seedRunId?: string) {
  const active = useRunSessionStore((s) => s.active);
  const setActive = useRunSessionStore((s) => s.setActive);
  const setStreamText = useRunSessionStore((s) => s.setStreamText);
  const streamText = useRunSessionStore((s) => s.streamText);

  const runId = active && active.chatId === chatId ? active.runId : seedRunId;
  const triggerRunId = active && active.chatId === chatId ? active.triggerRunId : null;
  const token = active && active.chatId === chatId ? active.realtimeToken : undefined;

  const snapshotQuery = useQuery({
    queryKey: queryKeys.run(chatId ?? "", runId ?? ""),
    queryFn: () => runApi.snapshot(chatId!, runId!),
    enabled: Boolean(chatId && runId),
    refetchInterval: (query) => (isActiveRun(query.state.data?.status) ? 2500 : false),
  });

  const realtime = useRealtimeRunWithStreams(triggerRunId ?? undefined, {
    accessToken: token,
    enabled: Boolean(triggerRunId && token),
  });

  const liveMetadata = useMemo(() => {
    const meta = (realtime.run as { metadata?: unknown } | undefined)?.metadata;
    const parsed = runSnapshotSchema.partial().safeParse(meta);
    return parsed.success ? parsed.data : undefined;
  }, [realtime.run]);

  useEffect(() => {
    const parts = (realtime.streams as Record<string, TextChunk[] | undefined> | undefined)?.[
      "assistant-text"
    ];
    if (!parts?.length) return;
    const joined = parts.map((part) => (typeof part?.text === "string" ? part.text : "")).join("");
    setStreamText(joined);
  }, [realtime.streams, setStreamText]);

  const status = preferRunStatus(liveMetadata?.status, snapshotQuery.data?.status);

  useEffect(() => {
    if (status && !isActiveRun(status) && active?.chatId === chatId) {
      setActive(null);
    }
  }, [status, active?.chatId, chatId, setActive]);

  useEffect(() => {
    const snap = snapshotQuery.data;
    if (!snap || active?.chatId === chatId) return;
    if (isActiveRun(snap.status)) {
      setActive({
        chatId: snap.chatId,
        runId: snap.runId,
        triggerRunId: snap.triggerRunId,
        realtimeToken: snap.realtimeToken,
        messageId: snap.messageId,
      });
    }
  }, [snapshotQuery.data, active?.chatId, chatId, setActive]);

  const snapshot: Partial<RunSnapshot> | undefined = useMemo(() => {
    const rest = snapshotQuery.data;
    if (!rest && !liveMetadata) return undefined;
    return {
      ...rest,
      ...liveMetadata,
      status: status ?? rest?.status ?? liveMetadata?.status,
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
    streamText,
    isLive: Boolean(triggerRunId && token && !realtimeFailed),
    isPolling: realtimeFailed || !triggerRunId,
    error: realtime.error,
    refetch: snapshotQuery.refetch,
  };
}
