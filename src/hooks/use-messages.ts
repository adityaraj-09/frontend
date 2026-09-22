"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { messageApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import { contentBlockSchema, type ContentBlock, type Message } from "@/lib/api/schemas";

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
