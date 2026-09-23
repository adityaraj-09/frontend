"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Copy, GitFork, Globe, Loader2, Sparkles, Terminal, ThumbsDown, ThumbsUp, Wrench, Zap } from "lucide-react";
import { chatApi } from "@/lib/api/services";
import { ForkTaskDialog } from "./fork-task-dialog";
import type { ContentBlock, Message, RunSnapshot } from "@/lib/api/schemas";
import { parseBlocks } from "@/hooks/use-messages";
import { formatDuration, formatTurnUsage, liveStepLabel, toolLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChatImage, ChatImageMetaContext } from "./chat-image";
import { MarkdownText, mergeAssistantText, normalizeMediaUrl } from "./markdown-text";
import { WaitpointCard } from "./waitpoint-card";

export function MessageList({
  messages,
  snapshot,
  streamText,
  hasEarlier,
  onLoadEarlier,
  isFetchingEarlier,
  footer,
}: {
  messages: Message[];
  snapshot?: Partial<RunSnapshot>;
  streamText: string;
  hasEarlier?: boolean;
  onLoadEarlier?: () => Promise<unknown> | void;
  isFetchingEarlier?: boolean;
  footer?: ReactNode;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(messages.length);
  const lastId = messages[messages.length - 1]?.id;
  const stickToBottom = useRef(true);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (messages[index]?.role === "USER" ? 88 : 168),
    overscan: 8,
    gap: 24,
    paddingStart: 24,
    paddingEnd: 24,
    getItemKey: (index) => messages[index]?.id ?? index,
    initialRect: { width: 760, height: 640 },
    followOnAppend: true,
  });

  useLayoutEffect(() => {
    const added = messages.length - prevCount.current;
    if (added > 0 && !stickToBottom.current) {
      virtualizer.scrollToIndex(added, { align: "start" });
    }
    prevCount.current = messages.length;
  }, [messages.length, virtualizer]);

  useEffect(() => {
    if (!lastId || !stickToBottom.current) return;
    virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
  }, [lastId, messages.length, streamText, virtualizer]);

  function maybeLoadEarlier() {
    const el = parentRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
    if (el.scrollTop < 48 && hasEarlier && !isFetchingEarlier && !stickToBottom.current) {
      void onLoadEarlier?.();
    }
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="h-full min-h-0 flex-1 overflow-y-auto" onScroll={maybeLoadEarlier}>
      {hasEarlier ? (
        <div className="flex justify-center py-3">
          <button
            type="button"
            className="text-[12px] font-semibold text-muted-foreground"
            disabled={isFetchingEarlier}
            onClick={() => void onLoadEarlier?.()}
          >
            {isFetchingEarlier ? "Loading…" : "Load earlier messages"}
          </button>
        </div>
      ) : null}
      <div
        className="relative mx-auto w-full max-w-[760px] px-4"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((item) => {
          const message = messages[item.index];
          if (!message) return null;
          return (
            <div
              key={item.key}
              data-index={item.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${item.start}px)` }}
            >
              {message.role === "USER" ? (
                <UserBubble message={message} />
              ) : (
                <AssistantTurn message={message} snapshot={snapshot} streamText={streamText} />
              )}
            </div>
          );
        })}
      </div>
      {footer}
    </div>
  );
}

function UserBubble({ message }: { message: Message }) {
  const blocks = parseBlocks(message.contentBlocks);
  const text = blocks
    .filter((block): block is Extract<ContentBlock, { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  const images = userImages(message, blocks);
  const files = message.attachments.filter((file) => !file.mimeType.startsWith("image/"));
  return (
    <div className="flex justify-end">
      <div className="max-w-[420px] rounded-[20px] bg-muted p-2 text-[14px] leading-6 text-foreground">
        {images.map((image) => (
          <ChatImageMetaContext.Provider
            key={image.url}
            value={{
              prompt: text,
              createdAt: message.createdAt,
              source: "Uploaded",
              attachmentId: image.attachmentId,
            }}
          >
            <ChatImage
              src={image.url}
              alt={image.alt}
              filename={image.alt}
              attachmentId={image.attachmentId}
              className="h-auto w-auto max-h-[220px] max-w-[240px] rounded-[16px] object-contain"
            />
          </ChatImageMetaContext.Provider>
        ))}
        {text ? <p className={cn("px-2", images.length ? "pt-2 pb-1" : "py-1.5")}>{text}</p> : null}
        {files.length ? (
          <div className="flex flex-wrap gap-2 px-2 pb-1">
            {files.map((file) => (
              <span key={file.id} className="text-[12px] font-medium text-muted-foreground">
                {file.filename}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function userImages(
  message: Message,
  blocks: ContentBlock[],
): Array<{ url: string; alt: string; attachmentId?: string }> {
  const seen = new Set<string>();
  const images: Array<{ url: string; alt: string; attachmentId?: string }> = [];
  const push = (url: string | null | undefined, alt: string, attachmentId?: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    images.push({ url, alt, attachmentId });
  };
  for (const file of message.attachments) {
    if (file.mimeType.startsWith("image/")) push(file.url || file.thumbnailUrl, file.filename, file.id);
  }
  for (const block of blocks) {
    if (block.type === "asset" && block.mimeType.startsWith("image/")) {
      push(block.url, block.filename ?? "Uploaded image");
    }
  }
  return images;
}

function AssistantTurn({
  message,
  snapshot,
  streamText,
}: {
  message: Message;
  snapshot?: Partial<RunSnapshot>;
  streamText: string;
}) {
  const blocks = parseBlocks(message.contentBlocks);
  const live =
    snapshot?.assistantMessageId === message.id ||
    (message.status === "STREAMING" && !snapshot?.assistantMessageId);
  const results = new Map(
    blocks
      .filter((block): block is Extract<ContentBlock, { type: "tool_result" }> => block.type === "tool_result")
      .map((block) => [block.toolCallId, block]),
  );
  const persisted = blocks
    .filter((block): block is Extract<ContentBlock, { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("");
  const text = mergeAssistantText(persisted, streamText, live);
  const leftoverStream =
    live && streamText && persisted && streamText.startsWith(persisted)
      ? streamText.slice(persisted.length)
      : "";
  const seenTools = new Set(
    blocks.filter((block) => block.type === "tool_use").map((block) => block.toolCallId),
  );
  const pendingLive = live
    ? (snapshot?.tools ?? []).filter((tool) => !seenTools.has(tool.toolCallId))
    : [];
  const assets = blocks.filter(
    (block): block is Extract<ContentBlock, { type: "asset" }> => block.type === "asset",
  );
  const uniqueAssets = uniqueAssetBlocks(assets);
  const shownAssetUrls = new Set(uniqueAssets.map((asset) => normalizeMediaUrl(asset.url)));
  const prompts = generationPrompts(blocks);
  const waitpoint =
    snapshot?.waitpoint && snapshot.waitpoint.type !== "MEDIA" && snapshot.waitpoint.status === "WAITING"
      ? snapshot.waitpoint
      : null;
  const failed = message.status === "FAILED" || (live && snapshot?.status === "FAILED");
  const cancelled = message.status === "CANCELLED" || (live && snapshot?.status === "CANCELLED");
  const hasVisible = blocks.some((block) => block.type !== "tool_result") || Boolean(text) || pendingLive.length > 0;

  return (
    <ChatImageMetaContext.Provider
      value={{ prompt: prompts.first, createdAt: message.createdAt, source: "Generated in chat" }}
    >
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => {
        if (block.type === "thinking") {
          return (
            <ThinkingNote
              key={`thinking-${index}`}
              text={block.text}
              durationMs={block.durationMs ?? snapshot?.thinkingDurationMs}
            />
          );
        }
        if (block.type === "text") {
          return <MarkdownText key={`text-${index}`} text={block.text} skipImages={shownAssetUrls} />;
        }
        if (block.type === "tool_use") {
          const liveRow = snapshot?.tools?.find((row) => row.toolCallId === block.toolCallId);
          const result = results.get(block.toolCallId);
          return (
            <ToolRow
              key={block.toolCallId}
              name={block.toolName}
              input={block.input}
              output={result?.output}
              durationMs={result?.durationMs}
              error={result?.error ?? liveRow?.errorMessage ?? undefined}
              status={liveRow?.status ?? (result ? (result.error ? "FAILED" : "SUCCESS") : "RUNNING")}
            />
          );
        }
        return null;
      })}
      {pendingLive.map((tool) => (
        <ToolRow
          key={tool.toolCallId}
          name={tool.toolName}
          input={tool.input ?? {}}
          output={undefined}
          error={tool.errorMessage ?? undefined}
          status={tool.status}
        />
      ))}
      {live && leftoverStream ? <MarkdownText text={leftoverStream} skipImages={shownAssetUrls} /> : null}
      {live && !persisted && streamText ? <MarkdownText text={streamText} skipImages={shownAssetUrls} /> : null}
      {!hasVisible && live ? (
        <LiveStatus currentStep={snapshot?.currentStep} status={snapshot?.status} />
      ) : null}
      {uniqueAssets.map((asset) => (
        <AssetBlock
          key={asset.url}
          asset={asset}
          prompt={prompts.byUrl.get(normalizeMediaUrl(asset.url)) ?? prompts.first}
        />
      ))}
      {!live && (text || assets.length) ? (
        <ReplyActions
          chatId={message.chatId}
          messageId={message.id}
          text={text}
          createdAt={message.createdAt}
          usage={message.usage ?? (snapshot?.assistantMessageId === message.id ? snapshot.usage : undefined)}
        />
      ) : null}
      {failed ? (
        <p role="alert" className="text-[13px] text-[#b42318]">
          {message.errorMessage || snapshot?.errorMessage || "This turn failed. Send another message to retry."}
        </p>
      ) : null}
      {cancelled ? <p className="text-[13px] text-muted-foreground">Stopped.</p> : null}
      {live && waitpoint ? (
        <WaitpointCard chatId={snapshot?.chatId ?? message.chatId} waitpoint={waitpoint} />
      ) : null}
    </div>
    </ChatImageMetaContext.Provider>
  );
}

function LiveStatus({
  currentStep,
  status,
}: {
  currentStep?: string | null;
  status?: string | null;
}) {
  return (
    <p className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      {liveStepLabel(currentStep, status)}
    </p>
  );
}

function ThinkingNote({ text, durationMs }: { text: string; durationMs?: number | null }) {
  const [open, setOpen] = useState(false);
  const duration = formatDuration(durationMs);
  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-1 text-[13px] font-semibold text-muted-foreground"
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronDown className={cn("size-3.5", !open && "-rotate-90")} />
        Thinking{duration ? ` · ${duration}` : ""}
      </button>
      {open ? <p className="mt-2 max-w-[640px] text-[13px] font-medium leading-5 text-muted-foreground">{text}</p> : null}
    </div>
  );
}

function ToolRow({
  name,
  input,
  output,
  durationMs,
  error,
  status,
}: {
  name: string;
  input: unknown;
  output: unknown;
  durationMs?: number;
  error?: string;
  status: string;
}) {
  const [open, setOpen] = useState(
    status === "RUNNING" || name === "web_search" || hasToolOutputImage(output),
  );
  const Icon = iconFor(name);
  const success = status === "SUCCESS";
  const running = status === "RUNNING" || status === "PENDING";
  const duration = formatDuration(durationMs);
  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-muted"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon className={cn("size-4 stroke-[1.7]", iconTone(name))} />
        <span className="text-[13px] font-semibold text-foreground">{toolLabel(name)}</span>
        {success ? <Check className="size-3.5 text-[#16a34a]" strokeWidth={2.5} /> : null}
        {running ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : null}
        {error ? <span className="text-[11px] font-semibold text-[#b42318]">Failed</span> : null}
        {duration ? <span className="text-[12px] font-medium text-muted-foreground">{duration}</span> : null}
        <ChevronDown className={cn("ml-auto size-3.5 text-muted-foreground", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mb-2 ml-6 rounded-2xl border border-border bg-background p-4">
          {name === "web_search" ? (
            <WebSearchBody output={output} input={input} />
          ) : (
            <FieldList input={input} output={output} toolName={name} />
          )}
          {error ? <p className="mt-2 text-[12px] text-[#b42318]">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function FieldList({ input, output, toolName }: { input: unknown; output: unknown; toolName: string }) {
  const fields = toolFields(toolName, input, output);
  if (!fields.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => (
        <div key={field.label} className="grid grid-cols-[140px_1fr] items-start gap-3">
          <div className="pt-0.5 text-[13px] font-semibold text-muted-foreground">{field.label}</div>
          <FieldValue
            value={field.value}
            label={field.label}
            prompt={
              stringField(flattenRecord(asRecord(input)), ["prompt"]) ||
              stringField(flattenRecord(asRecord(output)), ["prompt"])
            }
          />
        </div>
      ))}
    </div>
  );
}

function FieldValue({ value, label, prompt }: { value: Field["value"]; label: string; prompt?: string }) {
  if (value.kind === "image") {
    return (
      <ChatImage
        src={value.url}
        alt={label}
        prompt={prompt}
        className="h-auto w-auto max-h-[220px] max-w-[240px] rounded-xl object-contain"
      />
    );
  }
  return <div className="text-[13px] text-foreground">{value.text}</div>;
}

function WebSearchBody({ output, input }: { output: unknown; input: unknown }) {
  const record = asRecord(output) ?? asRecord(input);
  const query =
    (typeof record?.query === "string" && record.query) ||
    (typeof record?.queries === "string" && record.queries) ||
    (Array.isArray(record?.queries) ? record.queries.filter((item): item is string => typeof item === "string").join("  ") : "") ||
    "";
  const results = Array.isArray(record?.results) ? record.results : [];
  return (
    <div>
      {query ? (
        <div className="mb-3 rounded-xl border border-border px-3 py-2">
          <div className="text-[11px] font-semibold text-muted-foreground">Queries</div>
          <p className="text-[13px] font-medium text-foreground">{query}</p>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {results.slice(0, 6).map((row, index) => {
          const item = asRecord(row);
          const title = String(item?.title ?? item?.url ?? "Result");
          const url = String(item?.url ?? "");
          const host = safeHost(url);
          return (
            <a
              key={`${url}-${index}`}
              href={url || undefined}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-xl border border-border"
            >
              {typeof item?.image === "string" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" className="h-24 w-full object-cover" />
              ) : (
                <div className="flex h-24 items-center justify-center bg-[#ece6f0] text-foreground">
                  <Globe className="size-6" />
                </div>
              )}
              <div className="p-2">
                <div className="truncate text-[11px] text-muted-foreground">{host}</div>
                <div className="line-clamp-2 text-[12px] font-semibold text-foreground">{title}</div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ReplyActions({
  chatId,
  messageId,
  text,
  createdAt,
  usage,
}: {
  chatId: string;
  messageId: string;
  text: string;
  createdAt: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    credits?: string;
    model?: string | null;
    durationMs?: number | null;
  } | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [forkOpen, setForkOpen] = useState(false);
  const [forking, setForking] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function fork() {
    setForking(true);
    try {
      const created = await chatApi.fork(chatId, messageId);
      setForkOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
      router.push(`/chat/${created.id}`);
    } finally {
      setForking(false);
    }
  }

  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <button type="button" aria-label={copied ? "Copied" : "Copy"} className="hover:text-foreground" onClick={() => void copy()}>
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
      <button
        type="button"
        aria-label="Like"
        aria-pressed={vote === "up"}
        className={cn("hover:text-foreground", vote === "up" && "text-foreground")}
        onClick={() => setVote((current) => (current === "up" ? null : "up"))}
      >
        <ThumbsUp className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Dislike"
        aria-pressed={vote === "down"}
        className={cn("hover:text-foreground", vote === "down" && "text-foreground")}
        onClick={() => setVote((current) => (current === "down" ? null : "down"))}
      >
        <ThumbsDown className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Fork task"
        className="hover:text-foreground"
        onClick={() => setForkOpen(true)}
      >
        <GitFork className="size-3.5" strokeWidth={1.75} />
      </button>
      <span className="text-[12px]">{messageClock(createdAt)}</span>
      {usage ? <span className="text-[12px]">{formatTurnUsage(usage)}</span> : null}
      <ForkTaskDialog open={forkOpen} onOpenChange={setForkOpen} onConfirm={fork} busy={forking} />
    </div>
  );
}

function messageClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

function uniqueAssetBlocks(assets: Extract<ContentBlock, { type: "asset" }>[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    const key = normalizeMediaUrl(asset.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generationPrompts(blocks: ContentBlock[]): { byUrl: Map<string, string>; first?: string } {
  const inputs = new Map<string, string>();
  for (const block of blocks) {
    if (block.type !== "tool_use") continue;
    const prompt = stringField(flattenRecord(asRecord(block.input)), ["prompt"]);
    if (prompt) inputs.set(block.toolCallId, prompt);
  }
  const byUrl = new Map<string, string>();
  let first: string | undefined;
  for (const block of blocks) {
    if (block.type !== "tool_result") continue;
    const fromOutput = stringField(flattenRecord(asRecord(block.output)), ["prompt"]);
    const prompt = inputs.get(block.toolCallId) ?? fromOutput;
    const url = stringField(flattenRecord(asRecord(block.output)), ["image_url", "video_url", "url"]);
    if (prompt && !first) first = prompt;
    if (prompt && url) byUrl.set(normalizeMediaUrl(url), prompt);
  }
  if (!first) first = inputs.values().next().value;
  return { byUrl, first };
}

function AssetBlock({
  asset,
  prompt,
}: {
  asset: Extract<ContentBlock, { type: "asset" }>;
  prompt?: string;
}) {
  if (asset.mimeType.startsWith("video/")) {
    return (
      <video
        src={asset.url}
        controls
        className="h-auto w-auto max-h-[220px] max-w-[240px] rounded-xl"
      />
    );
  }
  if (!asset.mimeType.startsWith("image/")) return null;
  return (
    <ChatImage
      src={asset.url}
      alt={asset.filename ?? "Generated image"}
      filename={asset.filename}
      prompt={prompt}
      className="h-auto w-auto max-h-[220px] max-w-[240px] rounded-xl object-contain"
    />
  );
}

type Field = {
  label: string;
  value: { kind: "text"; text: string } | { kind: "image"; url: string };
};

function toolFields(toolName: string, input: unknown, output: unknown): Field[] {
  const record = flattenRecord(asRecord(input));
  const fields: Field[] = [];
  if (toolName === "crop_image" || toolName === "gpt_image_2" || toolName === "merge_videos") {
    fields.push({ label: "Model", value: { kind: "text", text: toolName } });
  }
  const imageUrl = stringField(record, ["image_url", "image", "input_image"]);
  if (imageUrl) fields.push({ label: "Input Image", value: { kind: "image", url: imageUrl } });
  const prompt =
    stringField(record, ["prompt"]) || stringField(flattenRecord(asRecord(output)), ["prompt"]);
  if (prompt) fields.push({ label: "Prompt", value: { kind: "text", text: prompt } });
  pushNumber(fields, "X Position (%)", record.x_percent ?? record.x);
  pushNumber(fields, "Y Position (%)", record.y_percent ?? record.y);
  pushNumber(fields, "Width (%)", record.width_percent ?? record.width);
  pushNumber(fields, "Height (%)", record.height_percent ?? record.height);
  const videos = record.video_urls;
  if (Array.isArray(videos)) {
    fields.push({
      label: "Videos",
      value: { kind: "text", text: videos.filter((item) => typeof item === "string").join("\n") },
    });
  }
  const outputUrl = stringField(flattenRecord(asRecord(output)), ["image_url", "video_url", "url"]);
  if (outputUrl && outputUrl !== imageUrl) {
    fields.push(
      isVideoUrl(outputUrl)
        ? { label: "Output Video", value: { kind: "text", text: outputUrl } }
        : { label: "Output Image", value: { kind: "image", url: outputUrl } },
    );
  }
  if (fields.length) return fields;
  return Object.entries(record)
    .filter(([, value]) => value != null && typeof value !== "object")
    .map(([key, value]) => ({
      label: labelize(key),
      value: { kind: "text" as const, text: String(value) },
    }));
}

function pushNumber(fields: Field[], label: string, value: unknown) {
  if (typeof value === "number") fields.push({ label, value: { kind: "text", text: String(value) } });
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

function hasToolOutputImage(output: unknown): boolean {
  const outputUrl = stringField(flattenRecord(asRecord(output)), ["image_url", "video_url", "url"]);
  return Boolean(outputUrl && !isVideoUrl(outputUrl));
}

function stringField(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function flattenRecord(record: Record<string, unknown> | null): Record<string, unknown> {
  if (!record) return {};
  const crop = asRecord(record.crop);
  if (!crop) return record;
  return { ...record, ...crop };
}

function labelize(key: string): string {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function iconFor(name: string) {
  if (name === "web_search") return Globe;
  if (name === "load_skill" || name === "read_skill_asset") return Zap;
  if (name === "sandbox_run_code") return Terminal;
  if (name === "crop_image" || name === "gpt_image_2" || name === "merge_videos") return Sparkles;
  return Wrench;
}

function iconTone(name: string): string {
  if (name === "web_search") return "text-[#2563eb]";
  if (name === "load_skill" || name === "read_skill_asset") return "text-[#ca8a04]";
  if (name === "crop_image" || name === "gpt_image_2" || name === "merge_videos") return "text-[#7c3aed]";
  return "text-muted-foreground";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
