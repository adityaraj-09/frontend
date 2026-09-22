"use client";

import { useUser } from "@/lib/clerk";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi, meApi, uploadApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import type { Chat } from "@/lib/api/schemas";

export function useMeQuery() {
  const { isSignedIn } = useUser();
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => meApi.get(),
    enabled: Boolean(isSignedIn),
  });
}

export function useChatsQuery(search?: string, favorite?: boolean) {
  const { isSignedIn } = useUser();
  return useInfiniteQuery({
    queryKey: queryKeys.chats(search, favorite),
    queryFn: ({ pageParam }) =>
      chatApi.list({
        cursor: pageParam,
        q: search || undefined,
        favorite: favorite || undefined,
        limit: 30,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: Boolean(isSignedIn),
  });
}

type ChatPages = { pages: Array<{ items: Chat[]; nextCursor: string | null }>; pageParams: unknown[] };

function patchFavorite(old: unknown, id: string, isFavorite: boolean): unknown {
  if (!old || typeof old !== "object" || !("pages" in old)) return old;
  const data = old as ChatPages;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((chat) => (chat.id === id ? { ...chat, isFavorite } : chat)),
    })),
  };
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      chatApi.update(id, { isFavorite }),
    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      queryClient.setQueriesData({ queryKey: ["chats"] }, (old) => patchFavorite(old, id, isFavorite));
      queryClient.setQueryData(queryKeys.chat(id), (old: Chat | undefined) =>
        old ? { ...old, isFavorite } : old,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}

export function useLibraryQuery() {
  const { isSignedIn } = useUser();
  return useInfiniteQuery({
    queryKey: queryKeys.library,
    queryFn: ({ pageParam }) => uploadApi.library({ cursor: pageParam, limit: 24 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: Boolean(isSignedIn),
  });
}
