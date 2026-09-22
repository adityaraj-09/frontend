import { z } from "zod";

export const apiKeySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  prefix: z.string(),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
  revokedAt: z.string().nullable(),
});

export const apiKeyCreatedSchema = apiKeySchema.extend({
  key: z.string(),
});

export const apiKeyListSchema = z.object({
  items: z.array(apiKeySchema),
});

export const webhookEndpointSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  events: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const webhookCreatedSchema = webhookEndpointSchema.extend({
  secret: z.string(),
});

export const webhookListSchema = z.object({
  items: z.array(webhookEndpointSchema),
});

export const errorEnvelopeSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});

export const chatSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  isFavorite: z.boolean(),
  lastMessageAt: z.string(),
  lastMessageId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const chatListSchema = z.object({
  items: z.array(chatSchema),
  nextCursor: z.string().nullable(),
});

export const contentBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({
    type: z.literal("thinking"),
    text: z.string(),
    durationMs: z.number().int().nonnegative().optional(),
  }),
  z.object({
    type: z.literal("tool_use"),
    toolCallId: z.string(),
    toolName: z.string(),
    input: z.unknown(),
  }),
  z.object({
    type: z.literal("tool_result"),
    toolCallId: z.string(),
    toolName: z.string(),
    output: z.unknown().optional(),
    error: z.string().optional(),
  }),
  z.object({
    type: z.literal("asset"),
    url: z.string(),
    mimeType: z.string(),
    filename: z.string().optional(),
  }),
]);

export type ContentBlock = z.infer<typeof contentBlockSchema>;

export const attachmentSchema = z.object({
  id: z.string().uuid(),
  source: z.string().optional(),
  filename: z.string(),
  mimeType: z.string(),
  byteSize: z.number().optional(),
  url: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  status: z.string(),
  origin: z.string().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  durationMs: z.number().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

export const messageSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  role: z.string(),
  status: z.string(),
  contentBlocks: z.array(z.unknown()),
  createdAt: z.string(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  attachments: z.array(attachmentSchema),
});

export const messageListSchema = z.object({
  items: z.array(messageSchema),
  nextCursor: z.string().nullable(),
});

export const sendResponseSchema = z.object({
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
  runId: z.string().uuid(),
  triggerRunId: z.string().nullable().optional(),
  realtimeToken: z.string().optional(),
  status: z.string().optional(),
});

export const meSchema = z.object({
  id: z.string().uuid(),
  clerkUserId: z.string(),
  email: z.string(),
  creditBalance: z.string(),
});

export const ledgerListSchema = z.object({
  creditBalance: z.string(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.string(),
      amount: z.string(),
      balanceAfter: z.string(),
      reason: z.string(),
      chatId: z.string().nullable(),
      agentRunId: z.string().nullable(),
      toolInvocationId: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

export const runLiveStatusSchema = z.enum([
  "QUEUED",
  "THINKING",
  "WORKING",
  "WAITING",
  "STOPPING",
  "COMPLETE",
  "FAILED",
  "CANCELLED",
]);

export const toolLiveSchema = z.object({
  toolCallId: z.string(),
  toolName: z.string(),
  status: z.enum(["PENDING", "RUNNING", "SUCCESS", "FAILED", "CANCELLED"]),
  errorMessage: z.string().nullable().optional(),
});

export const waitpointOverlaySchema = z.object({
  waitpointId: z.string().uuid(),
  type: z.enum(["OPTIONS", "PLAN", "CREDIT", "MEDIA"]),
  status: z.enum(["WAITING", "COMPLETED", "EXPIRED", "CANCELLED"]),
  triggerWaitpointId: z.string(),
  publicAccessToken: z.string().nullable(),
  timeoutAt: z.string(),
  payload: z.unknown(),
});

export const runSnapshotSchema = z.object({
  chatId: z.string().uuid(),
  runId: z.string().uuid(),
  messageId: z.string().uuid(),
  assistantMessageId: z.string().uuid().nullable(),
  status: runLiveStatusSchema,
  currentStep: z.string().nullable(),
  thinkingDurationMs: z.number().int().nonnegative().nullable(),
  progressPercent: z.number().int().min(0).max(100).nullable(),
  tools: z.array(toolLiveSchema),
  waitpoint: waitpointOverlaySchema.nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  triggerRunId: z.string().nullable(),
  assistant: z
    .object({
      id: z.string().uuid(),
      status: z.string(),
      contentBlocks: z.array(z.unknown()),
    })
    .nullable(),
  realtimeToken: z.string().optional(),
});

export const signedUploadSchema = z.object({
  params: z.string(),
  signature: z.string(),
  expires: z.string(),
  assemblyUrl: z.string(),
  limits: z.object({
    maxFileBytes: z.number(),
    maxFiles: z.number(),
    mimeTypes: z.array(z.string()),
  }),
});

export const completeUploadSchema = z.object({
  attachments: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.string(),
      filename: z.string(),
    }),
  ),
});

export const attachmentListSchema = z.object({
  items: z.array(attachmentSchema),
  nextCursor: z.string().nullable(),
});

export type Chat = z.infer<typeof chatSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Attachment = z.infer<typeof attachmentSchema>;
export type SendResponse = z.infer<typeof sendResponseSchema>;
export type Me = z.infer<typeof meSchema>;
export type RunSnapshot = z.infer<typeof runSnapshotSchema>;
export type WaitpointOverlay = z.infer<typeof waitpointOverlaySchema>;
export type ToolLive = z.infer<typeof toolLiveSchema>;
export type SignedUpload = z.infer<typeof signedUploadSchema>;
