"use client";

import { useClerk, useUser } from "@/lib/clerk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { chatApi, messageApi } from "@/lib/api/services";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { useComposerStore } from "@/stores/composer";
import { useRunSessionStore } from "@/stores/run-session";

export function useSendMessage(chatId?: string) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const queryClient = useQueryClient();
  const text = useComposerStore((s) => s.text);
  const planMode = useComposerStore((s) => s.planMode);
  const attachmentIds = useComposerStore((s) => s.attachmentIds);
  const draftChatId = useComposerStore((s) => s.draftChatId);
  const reset = useComposerStore((s) => s.reset);
  const setError = useComposerStore((s) => s.setError);
  const setActive = useRunSessionStore((s) => s.setActive);

  return useMutation({
    mutationFn: async () => {
      const trimmed = text.trim();
      if (!trimmed) throw new ApiError("Write a message first", 400, "INVALID_REQUEST");
      const clientMessageId = crypto.randomUUID();
      let targetId = chatId ?? draftChatId ?? undefined;
      if (!targetId) {
        const created = await chatApi.create({
          title: trimmed.slice(0, 80),
        });
        targetId = created.id;
      }
      const sent = await messageApi.send(targetId, {
        text: trimmed,
        clientMessageId,
        planMode,
        attachmentIds: attachmentIds.length ? attachmentIds : undefined,
      });
      return sent;
    },
    onSuccess: async (sent) => {
      reset();
      setActive({
        chatId: sent.chatId,
        runId: sent.runId,
        triggerRunId: sent.triggerRunId ?? null,
        realtimeToken: sent.realtimeToken,
        messageId: sent.messageId,
      });
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.messages(sent.chatId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      if (!chatId) router.push(`/chat/${sent.chatId}`);
    },
    onError: (error) => {
      if (!isSignedIn) {
        openSignIn?.();
        setError("Sign in to assign a task.");
        return;
      }
      if (error instanceof ApiError) {
        if (error.code === "RUN_ACTIVE") {
          setError("This chat already has a running task. Stop it or wait for it to finish.");
          return;
        }
        if (error.code === "CREDITS_INSUFFICIENT") {
          setError("Not enough credits to start this turn.");
          return;
        }
        if (error.code === "RATE_LIMITED") {
          setError("Too many tasks. Wait a moment and try again.");
          return;
        }
        setError(error.message);
        return;
      }
      setError("Could not send. Check your connection and retry.");
    },
  });
}
