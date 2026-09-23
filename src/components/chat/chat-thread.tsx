"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Composer } from "@/components/composer/composer";
import { MessageList } from "./message-list";
import { applyLiveAssistant, applyPendingTurn, chronologicalMessages, useMessagesQuery } from "@/hooks/use-messages";
import { liveStreamForTurn, useRunRealtime } from "@/hooks/use-run-realtime";
import { chatApi, runApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import { isActiveRun } from "@/lib/format";
import { useRunSessionStore } from "@/stores/run-session";

export function ChatThread({ chatId }: { chatId: string }) {
  const queryClient = useQueryClient();
  const pending = useRunSessionStore((s) => s.pending);
  const setPending = useRunSessionStore((s) => s.setPending);
  useQuery({
    queryKey: queryKeys.chat(chatId),
    queryFn: () => chatApi.get(chatId),
  });
  const messagesQuery = useMessagesQuery(chatId);
  const persisted = useMemo(
    () => chronologicalMessages(messagesQuery.data?.pages),
    [messagesQuery.data?.pages],
  );
  const activeRun = useQuery({
    queryKey: ["active-run", chatId],
    queryFn: () => runApi.active(chatId),
    refetchInterval: (query) => (isActiveRun(query.state.data?.status) ? 4000 : false),
  });
  const realtime = useRunRealtime(chatId, activeRun.data?.runId ?? undefined);
  const turn = pending?.chatId === chatId ? pending : null;
  const snapshot = useMemo(() => {
    if (turn && realtime.snapshot?.status == null) {
      return {
        chatId,
        status: "THINKING" as const,
        currentStep: "thinking",
        assistantMessageId: turn.assistantId,
      };
    }
    return realtime.snapshot;
  }, [realtime.snapshot, turn, chatId]);
  const messages = useMemo(
    () => applyLiveAssistant(applyPendingTurn(persisted, turn), snapshot),
    [persisted, realtime.snapshot, turn, snapshot],
  );
  const lastAssistant = [...messages].reverse().find((message) => message.role === "ASSISTANT");

  useEffect(() => {
    if (!turn) return;
    const liveId = realtime.snapshot?.assistant?.id;
    if (liveId && liveId !== turn.assistantId) setPending(null);
    if (realtime.snapshot?.status && !isActiveRun(realtime.snapshot.status)) setPending(null);
  }, [turn, realtime.snapshot?.assistant?.id, realtime.snapshot?.status, setPending]);

  useEffect(() => {
    if (!realtime.snapshot?.status || isActiveRun(realtime.snapshot.status)) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chatFiles(chatId) });
  }, [realtime.snapshot?.status, chatId, queryClient]);

  useEffect(() => {
    if (!realtime.snapshot?.status || isActiveRun(realtime.snapshot.status)) return;
    void queryClient.invalidateQueries({ queryKey: ["chats"] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chat(chatId) });
  }, [realtime.snapshot?.status, chatId, queryClient]);

  return (
    <div className="flex h-full flex-col">
      <MessageList
        messages={messages}
        snapshot={snapshot}
        streamText={liveStreamForTurn({
          lastAssistant,
          assistantMessageId: snapshot?.assistantMessageId,
          status: snapshot?.status,
          streamText: realtime.streamText,
        })}
        hasEarlier={messagesQuery.hasNextPage}
        isFetchingEarlier={messagesQuery.isFetchingNextPage}
        onLoadEarlier={() => messagesQuery.fetchNextPage()}
      />
      <div className="flex justify-center px-4 pb-5 pt-2">
        <Composer chatId={chatId} variant="thread" />
      </div>
    </div>
  );
}
