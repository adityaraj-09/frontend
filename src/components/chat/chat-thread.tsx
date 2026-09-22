"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Composer } from "@/components/composer/composer";
import { MessageList } from "./message-list";
import { chronologicalMessages, useMessagesQuery } from "@/hooks/use-messages";
import { useRunRealtime } from "@/hooks/use-run-realtime";
import { chatApi, runApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import { isActiveRun } from "@/lib/format";

export function ChatThread({ chatId }: { chatId: string }) {
  const queryClient = useQueryClient();
  useQuery({
    queryKey: queryKeys.chat(chatId),
    queryFn: () => chatApi.get(chatId),
  });
  const messagesQuery = useMessagesQuery(chatId);
  const messages = useMemo(
    () => chronologicalMessages(messagesQuery.data?.pages),
    [messagesQuery.data?.pages],
  );
  const lastAssistant = [...messages].reverse().find((message) => message.role === "ASSISTANT");
  const activeRun = useQuery({
    queryKey: ["active-run", chatId],
    queryFn: () => runApi.active(chatId),
    refetchInterval: 4000,
  });
  const realtime = useRunRealtime(chatId, activeRun.data?.runId ?? undefined);

  useEffect(() => {
    if (!isActiveRun(realtime.snapshot?.status)) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
    }
  }, [realtime.snapshot?.status, chatId, queryClient]);

  return (
    <div className="flex h-full flex-col">
      <MessageList
        messages={messages}
        snapshot={realtime.snapshot}
        streamText={
          lastAssistant && realtime.snapshot?.assistantMessageId === lastAssistant.id
            ? realtime.streamText
            : ""
        }
        hasEarlier={messagesQuery.hasNextPage}
        isFetchingEarlier={messagesQuery.isFetchingNextPage}
        onLoadEarlier={() => messagesQuery.fetchNextPage()}
        footer={
          realtime.isPolling && isActiveRun(realtime.snapshot?.status) ? (
            <p className="px-4 pb-2 text-center text-[11px] text-[#a1a1aa]">
              Live stream unavailable — polling run status.
            </p>
          ) : null
        }
      />
      <div className="flex justify-center px-4 pb-5 pt-2">
        <Composer chatId={chatId} variant="thread" />
      </div>
    </div>
  );
}
