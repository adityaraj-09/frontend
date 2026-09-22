"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowUp, Mic, Paperclip, Plug, Square, X } from "lucide-react";
import { useComposerStore } from "@/stores/composer";
import { useSendMessage } from "@/hooks/use-send-message";
import { useUppyUpload } from "@/hooks/use-uppy-upload";
import { useRunSessionStore } from "@/stores/run-session";
import { runApi } from "@/lib/api/services";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AttachMenu } from "./attach-menu";

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
  const send = useSendMessage(chatId);
  const uppy = useUppyUpload(chatId);
  const active = useRunSessionStore((s) => s.active);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);

  const running = Boolean(chatId && active?.chatId === chatId);
  const uploading = pendingFiles.some((file) => file.status === "uploading" || file.status === "error");
  const canSend = text.trim().length > 0 && !send.isPending && !running && !uploading;
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

  return (
    <div className={cn("w-full", variant === "home" ? "max-w-[900px]" : "max-w-[760px]")}>
      <div
        className={cn(
          "relative flex min-h-[132px] w-full flex-col gap-3 overflow-visible rounded-[24px] bg-gradient-to-b from-[#f7f7f7] to-white px-4 pb-3 pt-4",
          variant === "thread" && "border border-[#ededed]",
        )}
      >
        {pendingFiles.length || libraryOnlyIds.length ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {pendingFiles.map((file) => (
              <span
                key={file.id}
                className="flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[11px] text-[#52525b] ring-1 ring-[#ededed]"
              >
                {file.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.previewUrl} alt="" className="size-4 rounded-full object-cover" />
                ) : null}
                <span className="max-w-[140px] truncate">{file.name}</span>
                {file.status === "uploading" ? (
                  <span className="tabular-nums text-[#a1a1aa]">{file.progress}%</span>
                ) : null}
                {file.status === "error" ? (
                  <button
                    type="button"
                    className="text-[#b42318]"
                    onClick={() => uppy.retry(file.id)}
                  >
                    Retry
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  className="text-[#a1a1aa] hover:text-[#1b1b1b]"
                  onClick={() => uppy.cancel(file.id)}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            {libraryOnlyIds.map((id) => (
              <span
                key={id}
                className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-[#52525b] ring-1 ring-[#ededed]"
              >
                attached
                <button
                  type="button"
                  aria-label="Remove attachment"
                  className="text-[#a1a1aa] hover:text-[#1b1b1b]"
                  onClick={() => removeAttachmentId(id)}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          aria-label={variant === "home" ? "Assign a task or ask anything" : "Send a message"}
          placeholder={variant === "home" ? "Assign a task or ask anything..." : "Send a message..."}
          className="min-h-6 w-full resize-none bg-transparent text-[14px] font-normal leading-6 tracking-normal text-[#1b1b1b] outline-none placeholder:text-[#777777]"
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
        <div className="mt-auto flex items-end justify-between pt-3">
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
                className="flex size-8 items-center justify-center rounded-full bg-[#1b1b1b] text-white"
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
                  canSend ? "bg-[#1b1b1b] text-white" : "cursor-not-allowed bg-[#fafafa] text-[#585858] opacity-50",
                )}
                onClick={() => send.mutate()}
              >
                <ArrowUp className="size-4 stroke-[2.2]" />
              </button>
            )}
          </div>
        </div>
        {attachOpen ? (
          <AttachMenu onClose={() => setAttachOpen(false)} onPickFiles={uppy.addFiles} />
        ) : null}
      </div>
      {planMode ? (
        <p className="mt-2 px-1 text-[12px] text-[#737373]">Plan mode — the agent will pause for approval before tools.</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 px-1 text-[12px] text-[#b42318]">
          {error}
        </p>
      ) : null}
    </div>
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
          "flex size-8 items-center justify-center rounded-full text-[#585858] hover:bg-[#fafafa] hover:text-[#343434]",
          pressed && "bg-[#f1f1f1] text-[#1b1b1b]",
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
