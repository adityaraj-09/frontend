"use client";

import { useClerk, useUser } from "@/lib/clerk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { chatApi, messageApi } from "@/lib/api/services";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { resolveProjectId } from "@/lib/project-route";
import { seedPendingMessages } from "@/hooks/use-messages";
import { useComposerStore } from "@/stores/composer";
import { useRunSessionStore } from "@/stores/run-session";

export function useSendMessage(chatId?: string, projectId?: string) {
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
  const setPending = useRunSessionStore((s) => s.setPending);

  return useMutation({
    mutationFn: async () => {
      const trimmed = text.trim();
      if (!trimmed) throw new ApiError("Write a message first", 400, "INVALID_REQUEST");
      const clientMessageId = crypto.randomUUID();
      const files = [...attachmentIds];
      const planning = planMode;
      let targetId = chatId ?? draftChatId ?? undefined;
      const ownedProjectId = resolveProjectId(projectId);
      if (!targetId) {
        const created = await chatApi.create({
          title: trimmed.slice(0, 80),
          projectId: ownedProjectId,
        });
        targetId = created.id;
        queryClient.setQueryData(queryKeys.chat(created.id), created);
      } else if (!chatId && ownedProjectId) {
        await chatApi.update(targetId, { projectId: ownedProjectId });
      }

      const pending = {
        chatId: targetId,
        text: trimmed,
        userId: clientMessageId,
        assistantId: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        attachments: snapshotsForSend(files),
      };
      setPending(pending);
      seedPendingMessages(queryClient, pending);
      reset();
      if (!chatId) router.push(`/chat/${targetId}`);

      const sent = await messageApi.send(targetId, {
        text: trimmed,
        clientMessageId,
        planMode: planning,
        attachmentIds: files.length ? files : undefined,
      });
      return sent;
    },
    onSuccess: (sent) => {
      setActive({
        chatId: sent.chatId,
        runId: sent.runId,
        triggerRunId: sent.triggerRunId ?? null,
        realtimeToken: sent.realtimeToken,
        messageId: sent.messageId,
      });
      void queryClient.invalidateQueries({ queryKey: ["chats"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(sent.chatId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: (error) => {
      setPending(null);
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

function snapshotsForSend(attachmentIds: string[]): Array<{
  id: string;
  filename: string;
  mimeType: string;
  url: string;
  thumbnailUrl?: string | null;
}> {
  const files = useComposerStore.getState().pendingFiles;
  return attachmentIds.flatMap((id) => {
    const file = files.find((item) => item.attachmentId === id);
    const url = file?.previewUrl;
    if (!url) return [];
    return [
      {
        id,
        filename: file.name,
        mimeType: file.mimeType || mimeFromName(file.name),
        url,
        thumbnailUrl: url,
      },
    ];
  });
}

function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  return "image/png";
}

