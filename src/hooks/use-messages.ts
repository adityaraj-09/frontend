"use client";

import { useInfiniteQuery, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { messageApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import { contentBlockSchema, type ContentBlock, type Message, type RunSnapshot } from "@/lib/api/schemas";
import type { PendingTurn } from "@/stores/run-session";

export function parseBlocks(raw: unknown[]): ContentBlock[] {
  return raw.flatMap((block) => {
    const parsed = contentBlockSchema.safeParse(block);
    return parsed.success ? [parsed.data] : [];
  });
}

export function useMessagesQuery(chatId: string | undefined) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages(chatId ?? ""),
    queryFn: ({ pageParam }) =>
      messageApi.list(chatId!, { cursor: pageParam, limit: 40 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: Boolean(chatId),
  });
}

export function chronologicalMessages(
  pages: Array<{ items: Message[] }> | undefined,
): Message[] {
  if (!pages) return [];
  const seen = new Set<string>();
  const items: Message[] = [];
  for (const page of pages) {
    for (const message of page.items) {
      if (seen.has(message.id)) continue;
      seen.add(message.id);
      items.push(message);
    }
  }
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export function preferAssistant(
  live?: RunSnapshot["assistant"] | null,
  rest?: RunSnapshot["assistant"] | null,
): RunSnapshot["assistant"] | null {
  if (!live) return rest ?? null;
  if (!rest) return live;
  const liveBlocks = live.contentBlocks?.length ?? 0;
  const restBlocks = rest.contentBlocks?.length ?? 0;
  if (liveBlocks !== restBlocks) return liveBlocks > restBlocks ? live : rest;
  return assistantTextLength(live) >= assistantTextLength(rest) ? live : rest;
}

function assistantTextLength(assistant: NonNullable<RunSnapshot["assistant"]>): number {
  return parseBlocks(assistant.contentBlocks ?? [])
    .filter((block): block is Extract<ContentBlock, { type: "text" }> => block.type === "text")
    .reduce((sum, block) => sum + block.text.length, 0);
}

export function mergeLiveTools(
  live?: RunSnapshot["tools"] | null,
  rest?: RunSnapshot["tools"] | null,
): RunSnapshot["tools"] {
  const byId = new Map<string, NonNullable<RunSnapshot["tools"]>[number]>();
  for (const tool of rest ?? []) byId.set(tool.toolCallId, tool);
  for (const tool of live ?? []) {
    const current = byId.get(tool.toolCallId);
    const input = tool.input ?? current?.input;
    byId.set(tool.toolCallId, input !== undefined ? { ...current, ...tool, input } : { ...current, ...tool });
  }
  return [...byId.values()];
}

export function visibleWaitpoint(
  waitpoint?: RunSnapshot["waitpoint"] | null,
): RunSnapshot["waitpoint"] | null {
  if (!waitpoint || waitpoint.type === "MEDIA") return null;
  return waitpoint;
}

export function userTextOf(message: Message): string {
  return parseBlocks(message.contentBlocks)
    .filter((block): block is Extract<ContentBlock, { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export function applyPendingTurn(messages: Message[], pending?: PendingTurn | null): Message[] {
  if (!pending) return messages;
  const hasUser = messages.some(
    (message) =>
      message.id === pending.userId ||
      (message.role === "USER" && userTextOf(message) === pending.text),
  );
  const hasAssistant = messages.some(
    (message) =>
      message.role === "ASSISTANT" &&
      (message.id === pending.assistantId || message.status === "STREAMING"),
  );
  const next = [...messages];
  if (!hasUser) {
    next.push({
      id: pending.userId,
      chatId: pending.chatId,
      role: "USER",
      status: "SUCCESS",
      contentBlocks: [{ type: "text", text: pending.text }],
      createdAt: pending.createdAt,
      errorCode: null,
      errorMessage: null,
      attachments: [],
    });
  }
  if (!hasAssistant) {
    next.push({
      id: pending.assistantId,
      chatId: pending.chatId,
      role: "ASSISTANT",
      status: "STREAMING",
      contentBlocks: [],
      createdAt: new Date(new Date(pending.createdAt).getTime() + 1).toISOString(),
      errorCode: null,
      errorMessage: null,
      attachments: [],
    });
  }
  return next;
}

export function seedPendingMessages(queryClient: QueryClient, pending: PendingTurn): void {
  const seeded = applyPendingTurn([], pending);
  queryClient.setQueryData<InfiniteData<{ items: Message[]; nextCursor: string | null }>>(
    queryKeys.messages(pending.chatId),
    (current) => {
      if (!current?.pages.length) {
        return { pages: [{ items: seeded, nextCursor: null }], pageParams: [undefined] };
      }
      const [first, ...rest] = current.pages;
      const merged = applyPendingTurn(first?.items ?? [], pending);
      return { ...current, pages: [{ ...first, items: merged }, ...rest] };
    },
  );
}

/** Overlay the latest assistant blocks from the run snapshot so the thread updates before a messages refetch. */
export function applyLiveAssistant(
  messages: Message[],
  snapshot?: Partial<RunSnapshot>,
): Message[] {
  const live = snapshot?.assistant;
  if (!live) return messages;
  let found = false;
  const next = messages.map((message) => {
    const optimistic =
      !found &&
      message.role === "ASSISTANT" &&
      message.status === "STREAMING" &&
      message.id !== live.id &&
      parseBlocks(message.contentBlocks).length === 0;
    if (message.id !== live.id && !optimistic) return message;
    found = true;
    return {
      ...message,
      id: live.id,
      status: live.status,
      contentBlocks: live.contentBlocks.length ? live.contentBlocks : message.contentBlocks,
      errorCode: snapshot.errorCode ?? message.errorCode,
      errorMessage: snapshot.errorMessage ?? message.errorMessage,
      usage: snapshot.usage ?? message.usage,
    };
  });
  if (found) return next;
  if (!snapshot.chatId) return messages;
  const last = messages[messages.length - 1]?.createdAt;
  const createdAt = last
    ? new Date(new Date(last).getTime() + 1).toISOString()
    : new Date().toISOString();
  return [
    ...messages,
    {
      id: live.id,
      chatId: snapshot.chatId,
      role: "ASSISTANT",
      status: live.status,
      contentBlocks: live.contentBlocks,
      createdAt,
      errorCode: snapshot.errorCode ?? null,
      errorMessage: snapshot.errorMessage ?? null,
      usage: snapshot.usage,
      attachments: [],
    },
  ];
}
