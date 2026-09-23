import { z } from "zod";
import { apiJson } from "./client";
import {
  apiKeyCreatedSchema,
  apiKeyListSchema,
  attachmentListSchema,
  projectListSchema,
  projectSchema,
  attachmentRefSchema,
  chatListSchema,
  chatSchema,
  completeUploadSchema,
  ledgerListSchema,
  meSchema,
  messageListSchema,
  webhookCreatedSchema,
  webhookListSchema,
  runSnapshotSchema,
  sendResponseSchema,
  signedUploadSchema,
  type Chat,
  type Me,
  type Message,
  type Project,
  type RunSnapshot,
  type SendResponse,
  type SignedUpload,
} from "./schemas";

export const chatApi = {
  list(query?: { cursor?: string; q?: string; favorite?: boolean; projectId?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (query?.cursor) params.set("cursor", query.cursor);
    if (query?.q) params.set("q", query.q);
    if (query?.favorite) params.set("favorite", "true");
    if (query?.projectId) params.set("projectId", query.projectId);
    if (query?.limit) params.set("limit", String(query.limit));
    const suffix = params.size ? `?${params}` : "";
    return apiJson(`/api/chats${suffix}`, chatListSchema);
  },
  create(body?: { title?: string; projectId?: string }) {
    return apiJson("/api/chats", chatSchema, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });
  },
  get(chatId: string) {
    return apiJson(`/api/chats/${chatId}`, chatSchema);
  },
  update(chatId: string, body: { title?: string; isFavorite?: boolean; projectId?: string | null }) {
    return apiJson(`/api/chats/${chatId}`, chatSchema, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  remove(chatId: string) {
    return apiJson(`/api/chats/${chatId}`, z.null(), { method: "DELETE" });
  },
  fork(chatId: string, messageId: string) {
    return apiJson(`/api/chats/${chatId}/fork`, chatSchema, {
      method: "POST",
      body: JSON.stringify({ messageId }),
    });
  },
};

export const messageApi = {
  list(chatId: string, query?: { cursor?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (query?.cursor) params.set("cursor", query.cursor);
    if (query?.limit) params.set("limit", String(query.limit));
    const suffix = params.size ? `?${params}` : "";
    return apiJson(`/api/chats/${chatId}/messages${suffix}`, messageListSchema);
  },
  send(
    chatId: string,
    body: {
      text: string;
      clientMessageId?: string;
      planMode?: boolean;
      attachmentIds?: string[];
    },
  ) {
    return apiJson(`/api/chats/${chatId}/messages`, sendResponseSchema, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

export const runApi = {
  active(chatId: string) {
    return apiJson(
      `/api/chats/${chatId}/runs`,
      z.object({
        runId: z.string().uuid().nullable(),
        triggerRunId: z.string().nullable(),
        status: z.string().nullable(),
      }),
    );
  },
  snapshot(chatId: string, runId: string) {
    return apiJson(`/api/chats/${chatId}/runs/${runId}`, runSnapshotSchema);
  },
  cancel(chatId: string, runId: string) {
    return apiJson(
      `/api/chats/${chatId}/runs/${runId}/cancel`,
      z.object({
        chatId: z.string(),
        runId: z.string(),
        status: z.string(),
      }),
      { method: "POST" },
    );
  },
};

export const waitpointApi = {
  complete(chatId: string, waitpointId: string, decision: "approved" | "rejected") {
    return apiJson(
      `/api/chats/${chatId}/waitpoints/${waitpointId}`,
      z.object({
        chatId: z.string(),
        runId: z.string(),
        waitpointId: z.string(),
        decision: z.enum(["approved", "rejected"]),
        waitpoint: z.unknown().nullable(),
      }),
      { method: "POST", body: JSON.stringify({ decision }) },
    );
  },
};

export const meApi = {
  get() {
    return apiJson("/api/me", meSchema);
  },
  ledger(query?: { cursor?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (query?.cursor) params.set("cursor", query.cursor);
    if (query?.limit) params.set("limit", String(query.limit));
    const suffix = params.size ? `?${params}` : "";
    return apiJson(`/api/me/ledger${suffix}`, ledgerListSchema);
  },
};

export const uploadApi = {
  sign(chatId: string) {
    return apiJson(`/api/chats/${chatId}/uploads/sign`, signedUploadSchema, {
      method: "POST",
    });
  },
  complete(chatId: string, assembly: unknown) {
    return apiJson(`/api/chats/${chatId}/uploads/complete`, completeUploadSchema, {
      method: "POST",
      body: JSON.stringify(assembly),
    });
  },
  library(query?: { cursor?: string; limit?: number; chatId?: string }) {
    const params = new URLSearchParams();
    if (query?.cursor) params.set("cursor", query.cursor);
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.chatId) params.set("chatId", query.chatId);
    const suffix = params.size ? `?${params}` : "";
    return apiJson(`/api/attachments${suffix}`, attachmentListSchema);
  },
  reference(url: string) {
    return apiJson("/api/attachments/reference", attachmentRefSchema, {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },
};

export const keysApi = {
  list() {
    return apiJson("/api/keys", apiKeyListSchema);
  },
  create(name: string) {
    return apiJson("/api/keys", apiKeyCreatedSchema, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },
  revoke(keyId: string) {
    return apiJson(`/api/keys/${keyId}`, z.null(), { method: "DELETE" });
  },
};

export const projectApi = {
  list(query?: { cursor?: string; q?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (query?.cursor) params.set("cursor", query.cursor);
    if (query?.q) params.set("q", query.q);
    if (query?.limit) params.set("limit", String(query.limit));
    const suffix = params.size ? `?${params}` : "";
    return apiJson(`/api/projects${suffix}`, projectListSchema);
  },
  get(projectId: string) {
    return apiJson(`/api/projects/${projectId}`, projectSchema);
  },
  create(body: { name: string; icon?: string; memoryEnabled?: boolean }) {
    return apiJson("/api/projects", projectSchema, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(
    projectId: string,
    body: { name?: string; icon?: string; memoryEnabled?: boolean; instructions?: string },
  ) {
    return apiJson(`/api/projects/${projectId}`, projectSchema, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  remove(projectId: string) {
    return apiJson(`/api/projects/${projectId}`, z.null(), { method: "DELETE" });
  },
};

export const WEBHOOK_EVENTS = [
  "agent.started",
  "agent.completed",
  "agent.failed",
  "tool.completed",
] as const;

export const webhookApi = {
  list() {
    return apiJson("/api/webhook-endpoints", webhookListSchema);
  },
  create(body: { url: string; events: string[] }) {
    return apiJson("/api/webhook-endpoints", webhookCreatedSchema, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  remove(endpointId: string) {
    return apiJson(`/api/webhook-endpoints/${endpointId}`, z.null(), { method: "DELETE" });
  },
};

export type { Chat, Me, Message, Project, RunSnapshot, SendResponse, SignedUpload };
