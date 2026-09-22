"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, Download, Globe, ImageIcon, Terminal, Wrench, Zap } from "lucide-react";
import type { ContentBlock, Message, RunSnapshot, ToolLive } from "@/lib/api/schemas";
import { parseBlocks } from "@/hooks/use-messages";
import { formatDuration, toolLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui";
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
            className="text-[12px] text-[#737373]"
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
  return (
    <div className="max-w-[560px] rounded-[18px] bg-[#f3f3f5] px-4 py-3 text-[14px] leading-6 text-[#1b1b1b]">
      {text}
      {message.attachments.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {message.attachments.map((file) =>
            file.mimeType.startsWith("image/") && (file.thumbnailUrl || file.url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={file.id}
                src={file.thumbnailUrl || file.url || ""}
                alt={file.filename}
                className="h-16 rounded-lg object-cover"
              />
            ) : (
              <span key={file.id} className="text-[12px] text-[#737373]">
                {file.filename}
              </span>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
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
  const live = snapshot?.assistantMessageId === message.id || message.status === "STREAMING";
  const toolsFromBlocks = blocks.filter(
    (block): block is Extract<ContentBlock, { type: "tool_use" }> => block.type === "tool_use",
  );
  const results = new Map(
    blocks
      .filter((block): block is Extract<ContentBlock, { type: "tool_result" }> => block.type === "tool_result")
      .map((block) => [block.toolCallId, block]),
  );
  const assets = blocks.filter(
    (block): block is Extract<ContentBlock, { type: "asset" }> => block.type === "asset",
  );
  const thinking = blocks.find(
    (block): block is Extract<ContentBlock, { type: "thinking" }> => block.type === "thinking",
  );
  const text = [
    ...blocks
      .filter((block): block is Extract<ContentBlock, { type: "text" }> => block.type === "text")
      .map((block) => block.text),
    live ? streamText : "",
  ]
    .filter(Boolean)
    .join("");

  const liveTools = snapshot?.tools ?? [];
  const toolCount = Math.max(toolsFromBlocks.length, liveTools.length);
  const failed = message.status === "FAILED" || snapshot?.status === "FAILED";
  const cancelled = message.status === "CANCELLED" || snapshot?.status === "CANCELLED";

  return (
    <div className="flex flex-col gap-3">
      {thinking ? (
        <p className="text-[12px] text-[#a1a1aa]">
          Thought {formatDuration(thinking.durationMs ?? snapshot?.thinkingDurationMs)}
        </p>
      ) : null}
      {toolCount ? (
        <Steps
          tools={toolsFromBlocks}
          live={liveTools}
          results={results}
          completed={message.status !== "STREAMING" && snapshot?.status !== "WORKING" && snapshot?.status !== "THINKING"}
        />
      ) : null}
      {text ? (
        <div className="whitespace-pre-wrap text-[14px] leading-6 text-[#1b1b1b]">{text}</div>
      ) : live ? (
        <p className="text-[13px] text-[#a1a1aa]">{snapshot?.currentStep ?? "Working…"}</p>
      ) : null}
      {assets.map((asset) => (
        <GeneratedAsset key={asset.url} asset={asset} />
      ))}
      {failed ? (
        <p role="alert" className="text-[13px] text-[#b42318]">
          {message.errorMessage || snapshot?.errorMessage || "This turn failed. Send another message to retry."}
        </p>
      ) : null}
      {cancelled ? <p className="text-[13px] text-[#737373]">Stopped.</p> : null}
      {live && snapshot?.waitpoint?.status === "WAITING" ? (
        <WaitpointCard chatId={snapshot.chatId ?? message.chatId} waitpoint={snapshot.waitpoint} />
      ) : null}
    </div>
  );
}

function Steps({
  tools,
  live,
  results,
  completed,
}: {
  tools: Extract<ContentBlock, { type: "tool_use" }>[];
  live: ToolLive[];
  results: Map<string, Extract<ContentBlock, { type: "tool_result" }>>;
  completed: boolean;
}) {
  const [open, setOpen] = useState(true);
  const count = Math.max(tools.length, live.length) || tools.length;
  return (
    <div>
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 text-[13px] text-[#737373]",
          open && "rounded-md ring-2 ring-[#3b82f6] ring-offset-2",
        )}
        onClick={() => setOpen((value) => !value)}
      >
        {completed ? `Completed ${count} steps` : `Working · ${count} steps`}
        <ChevronDown className={cn("size-3.5 transition", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-2 flex flex-col gap-1">
          {(tools.length ? tools : live.map((tool) => ({ toolCallId: tool.toolCallId, toolName: tool.toolName, input: {} }))).map(
            (tool) => {
              const liveRow = live.find((row) => row.toolCallId === tool.toolCallId);
              const result = results.get(tool.toolCallId);
              return (
                <ToolRow
                  key={tool.toolCallId}
                  name={tool.toolName}
                  input={tool.input}
                  output={result?.output}
                  error={result?.error ?? liveRow?.errorMessage ?? undefined}
                  status={liveRow?.status ?? (result ? (result.error ? "FAILED" : "SUCCESS") : "RUNNING")}
                />
              );
            },
          )}
        </div>
      ) : null}
    </div>
  );
}

function ToolRow({
  name,
  input,
  output,
  error,
  status,
}: {
  name: string;
  input: unknown;
  output: unknown;
  error?: string;
  status: string;
}) {
  const [open, setOpen] = useState(status === "RUNNING" || name === "web_search");
  const Icon = iconFor(name);
  const success = status === "SUCCESS";
  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-[#fafafa]"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon className={cn("size-4 stroke-[1.7]", name === "web_search" ? "text-[#2563eb]" : "text-[#a16207]")} />
        <span className="flex-1 text-[13px] text-[#1b1b1b]">{toolLabel(name)}</span>
        {success ? <span className="text-[#16a34a]">✓</span> : null}
        {status === "RUNNING" ? <span className="size-1.5 animate-pulse rounded-full bg-[#737373]" /> : null}
        {error ? <span className="text-[11px] text-[#b42318]">Failed</span> : null}
        <ChevronDown className={cn("size-3.5 text-[#a1a1aa]", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mb-2 ml-6 rounded-2xl border border-[#ededed] p-3">
          {name === "web_search" ? (
            <WebSearchBody output={output} input={input} />
          ) : (
            <pre className="overflow-x-auto text-[12px] leading-5 text-[#52525b]">
              {JSON.stringify(output ?? input, null, 2)}
            </pre>
          )}
          {error ? <p className="mt-2 text-[12px] text-[#b42318]">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
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
        <div className="mb-3 rounded-xl border border-[#ededed] px-3 py-2">
          <div className="text-[11px] text-[#a1a1aa]">Queries</div>
          <p className="text-[13px] text-[#1b1b1b]">{query}</p>
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
              className="overflow-hidden rounded-xl border border-[#ededed]"
            >
              {typeof item?.image === "string" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" className="h-24 w-full object-cover" />
              ) : (
                <div className="flex h-24 items-center justify-center bg-[#ece6f0] text-[#1b1b1b]">
                  <Globe className="size-6" />
                </div>
              )}
              <div className="p-2">
                <div className="truncate text-[11px] text-[#737373]">{host}</div>
                <div className="line-clamp-2 text-[12px] font-medium text-[#1b1b1b]">{title}</div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function GeneratedAsset({ asset }: { asset: Extract<ContentBlock, { type: "asset" }> }) {
  const setArtifact = useUiStore((s) => s.setArtifact);
  const isImage = asset.mimeType.startsWith("image/");
  const isVideo = asset.mimeType.startsWith("video/");
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ededed]">
      <div className="px-3 py-2 text-[11px] text-[#a1a1aa]">URL</div>
      {isImage ? (
        <button
          type="button"
          className="block w-full"
          onClick={() => setArtifact({ title: asset.filename ?? "Image", url: asset.url, mimeType: asset.mimeType })}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.url} alt={asset.filename ?? "Generated image"} className="max-h-[360px] w-full object-contain" />
        </button>
      ) : isVideo ? (
        <video src={asset.url} controls className="max-h-[360px] w-full" />
      ) : (
        <a href={asset.url} className="flex items-center gap-2 px-3 pb-3 text-[13px] text-[#2563eb]" target="_blank">
          {asset.filename ?? asset.url}
          <Download className="size-3.5" />
        </a>
      )}
    </div>
  );
}

function iconFor(name: string) {
  if (name === "web_search") return Globe;
  if (name === "load_skill" || name === "read_skill_asset") return Zap;
  if (name === "sandbox_run_code") return Terminal;
  if (name.includes("image") || name.includes("crop")) return ImageIcon;
  return Wrench;
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
