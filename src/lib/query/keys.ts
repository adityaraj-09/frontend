import { meApi, chatApi, messageApi, runApi, uploadApi } from "@/lib/api/services";

export const queryKeys = {
  me: ["me"] as const,
  ledger: (cursor?: string) => ["ledger", cursor] as const,
  chats: (q?: string, favorite?: boolean) =>
    ["chats", { q: q ?? "", favorite: Boolean(favorite) }] as const,
  chat: (id: string) => ["chat", id] as const,
  messages: (chatId: string) => ["messages", chatId] as const,
  run: (chatId: string, runId: string) => ["run", chatId, runId] as const,
  library: ["library"] as const,
  apiKeys: ["api-keys"] as const,
  webhooks: ["webhook-endpoints"] as const,
};

export { meApi, chatApi, messageApi, runApi, uploadApi };
