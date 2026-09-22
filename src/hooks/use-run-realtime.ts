"use client";

import { useRealtimeRunWithStreams } from "@trigger.dev/react-hooks";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { runApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import { runSnapshotSchema, type RunSnapshot } from "@/lib/api/schemas";
import { isActiveRun } from "@/lib/format";
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
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return isActiveRun(status) ? 2500 : false;
    },
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

  useEffect(() => {
    const status = liveMetadata?.status ?? snapshotQuery.data?.status;
    if (status && !isActiveRun(status) && active?.chatId === chatId) {
      setActive(null);
    }
  }, [liveMetadata?.status, snapshotQuery.data?.status, active?.chatId, chatId, setActive]);

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

  const snapshot: Partial<RunSnapshot> | undefined = liveMetadata ?? snapshotQuery.data;
  const realtimeFailed = Boolean(realtime.error);

  return {
    snapshot,
    streamText,
    isLive: Boolean(triggerRunId && token && !realtimeFailed),
    isPolling: realtimeFailed || !triggerRunId,
    error: realtime.error,
    refetch: snapshotQuery.refetch,
  };
}
