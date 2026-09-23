"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowUp, Loader2, Mic, Paperclip, Plug, Square, X } from "lucide-react";
import { useComposerStore } from "@/stores/composer";
import { useSendMessage } from "@/hooks/use-send-message";
import { useUppyUpload } from "@/hooks/use-uppy-upload";
import { useLibraryQuery } from "@/hooks/use-queries";
import { useRunSessionStore } from "@/stores/run-session";
import { runApi } from "@/lib/api/services";
import { cn } from "@/lib/utils";
import type { LibraryAttachment } from "@/lib/api/schemas";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AttachMenu } from "./attach-menu";
import { LibraryDialog } from "@/components/library/library-dialog";

export function Composer({
  chatId,
  variant = "home",
}: {
  chatId?: string;
  variant?: "home" | "thread";
}) {
  const text = useComposerStore((s) => s.text);
  const setText = useComposerStore((s) => s.setText);
  const planMode = useComposerStore((s) => s.planMode);
  const setPlanMode = useComposerStore((s) => s.setPlanMode);
  const error = useComposerStore((s) => s.error);
  const attachmentIds = useComposerStore((s) => s.attachmentIds);
  const pendingFiles = useComposerStore((s) => s.pendingFiles);
  const removeAttachmentId = useComposerStore((s) => s.removeAttachmentId);
  const upsertPendingFile = useComposerStore((s) => s.upsertPendingFile);
  const send = useSendMessage(chatId);
  const uppy = useUppyUpload(chatId);
  const library = useLibraryQuery();
  const active = useRunSessionStore((s) => s.active);
  const pending = useRunSessionStore((s) => s.pending);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const addAttachmentIds = useComposerStore((s) => s.addAttachmentIds);

  const running = Boolean(
    chatId && (active?.chatId === chatId || pending?.chatId === chatId || send.isPending),
  );
  const uploading = pendingFiles.some(
    (file) => file.status === "uploading" || file.status === "error" || !file.attachmentId,
  );
  const canSend = text.trim().length > 0 && !send.isPending && !running && !uploading;
  const libraryItems = library.data?.pages.flatMap((page) => page.items) ?? [];
  const libraryOnlyIds = attachmentIds.filter(
    (id) => !pendingFiles.some((file) => file.attachmentId === id),
  );

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }

  async function onStop() {
    if (!chatId || !active) return;
    await runApi.cancel(chatId, active.runId);
  }

  const home = variant === "home";

  return (
    <div className={cn("w-full", home ? "max-w-[900px]" : "max-w-[760px]")}>
      <div
        className={cn(
          "relative flex w-full flex-col overflow-visible",
          home
            ? "min-h-[132px] rounded-[28px] bg-muted px-5 pb-3 pt-4"
            : "min-h-[132px] gap-3 rounded-[24px] border border-border bg-gradient-to-b from-muted to-background px-4 pb-3 pt-4",
        )}
      >
        {pendingFiles.length || libraryOnlyIds.length ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {pendingFiles.map((file) => (
              <span key={file.id} className="relative">
                {file.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.previewUrl} alt={file.name} className="size-14 rounded-xl object-cover" />
                ) : (
                  <span className="flex size-14 items-center justify-center rounded-xl bg-background text-[10px] font-semibold text-muted-foreground ring-1 ring-border">
                    {file.name.split(".").pop()}
                  </span>
                )}
                {file.status === "uploading" ? (
                  <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/25">
                    <Loader2 className="size-4 animate-spin text-white" />
                  </span>
                ) : null}
                {file.status === "error" ? (
                  <button
                    type="button"
                    className="absolute inset-x-0 bottom-1 text-center text-[10px] text-white"
                    onClick={() => uppy.retry(file.id)}
                  >
                    Retry
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-muted text-foreground"
                  onClick={() => uppy.cancel(file.id)}
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
            {libraryOnlyIds.map((id) => {
              const item = libraryItems.find((row) => row.id === id);
              return (
                <LibraryChip
                  key={id}
                  item={item}
                  onRemove={() => removeAttachmentId(id)}
                />
              );
            })}
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          aria-label={home ? "Assign a task or ask anything" : "Send a message"}
          placeholder={home ? "Assign a task or ask anything..." : "Send a message..."}
          className="min-h-6 w-full resize-none bg-transparent text-[14px] font-medium leading-6 tracking-normal text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            setText(event.target.value);
            resize();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canSend) send.mutate();
            }
          }}
        />
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-1">
            <IconButton label="Attach files" onClick={() => setAttachOpen((open) => !open)}>
              <Paperclip className="size-4" strokeWidth={1.75} />
            </IconButton>
            <IconButton
              label={planMode ? "Plan mode on" : "Connect apps"}
              pressed={planMode}
              onClick={() => setPlanMode(!planMode)}
            >
              <Plug className="size-4 -rotate-45" strokeWidth={1.75} />
            </IconButton>
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              label="Dictation"
              onClick={() => {
                const Speech = (
                  window as unknown as {
                    webkitSpeechRecognition?: new () => {
                      start: () => void;
                      onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
                    };
                  }
                ).webkitSpeechRecognition;
                if (!Speech) return;
                const rec = new Speech();
                rec.onresult = (ev) => {
                  const said = ev.results[0]?.[0]?.transcript;
                  if (said) setText(text ? `${text} ${said}` : said);
                };
                rec.start();
              }}
            >
              <Mic className="size-4" strokeWidth={1.75} />
            </IconButton>
            {running ? (
              <button
                type="button"
                aria-label="Stop"
                className="flex size-8 items-center justify-center rounded-[10px] bg-[#e11d48] text-white"
                onClick={() => void onStop()}
              >
                <Square className="size-3 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Send message"
                disabled={!canSend}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full transition-all",
                  canSend
                    ? "bg-foreground text-background"
                    : home
                      ? "cursor-not-allowed text-muted-foreground"
                      : "cursor-not-allowed bg-muted text-muted-foreground opacity-50",
                )}
                onClick={() => send.mutate()}
              >
                <ArrowUp className="size-4 stroke-[2.2]" />
              </button>
            )}
          </div>
        </div>
        {attachOpen ? (
          <AttachMenu
            onClose={() => setAttachOpen(false)}
            onPickFiles={uppy.addFiles}
            onSelectAsset={() => {
              setAttachOpen(false);
              setLibraryOpen(true);
            }}
          />
        ) : null}
      </div>
      <LibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(item) => {
          addAttachmentIds([item.id]);
          upsertPendingFile({
            id: item.id,
            name: item.filename,
            previewUrl: item.url || previewFor(item),
            mimeType: item.mimeType,
            progress: 100,
            status: "complete",
            attachmentId: item.id,
          });
        }}
      />
      {planMode ? (
        <p className="mt-2 px-1 text-[12px] font-medium text-muted-foreground">Plan mode — the agent will pause for approval before tools.</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 px-1 text-[12px] text-[#b42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function previewFor(item: Pick<LibraryAttachment, "filename" | "mimeType" | "url" | "thumbnailUrl">) {
  return item.thumbnailUrl || (item.mimeType.startsWith("image/") ? item.url : null) || undefined;
}

function LibraryChip({
  item,
  onRemove,
}: {
  item?: LibraryAttachment;
  onRemove: () => void;
}) {
  const name = item?.filename ?? "file";
  const src = item ? previewFor(item) : undefined;
  return (
    <span className="relative">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-14 rounded-xl object-cover" />
      ) : (
        <span className="flex size-14 items-center justify-center rounded-xl bg-background text-[10px] font-semibold text-muted-foreground ring-1 ring-border">
          {name.includes(".") ? name.split(".").pop() : name}
        </span>
      )}
      <button
        type="button"
        aria-label={`Remove ${name}`}
        className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-muted text-foreground"
        onClick={onRemove}
      >
        <X className="size-2.5" />
      </button>
    </span>
  );
}

function IconButton({
  label,
  children,
  onClick,
  pressed,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  pressed?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground",
          pressed && "bg-muted text-foreground",
        )}
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
