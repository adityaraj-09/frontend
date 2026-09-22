"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Calendar, Copy, Download, FileText, Hash, Heart, ImagePlus, Maximize2, Pencil, Proportions, Trash2, X } from "lucide-react";
import { uploadApi } from "@/lib/api/services";
import { useComposerStore } from "@/stores/composer";
import { cn } from "@/lib/utils";

export type ChatImageMeta = {
  prompt?: string;
  createdAt?: string;
  source?: string;
  attachmentId?: string;
};

export const ChatImageMetaContext = createContext<ChatImageMeta>({});

export function ChatImage({
  src,
  alt,
  filename,
  attachmentId,
  className,
}: {
  src?: string;
  alt?: string;
  filename?: string;
  attachmentId?: string;
  className?: string;
}) {
  const meta = useContext(ChatImageMetaContext);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!src) return null;
  const generated = (meta.source ?? "Generated in chat") === "Generated in chat";
  const name = displayFileName(filename || alt, src, generated);

  return (
    <>
      <span className="group relative inline-block max-w-full align-top">
        <button type="button" className="block" onClick={() => setOpen(true)} aria-label={`Preview ${name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt || name} className={cn("block", className)} />
        </button>
        <span className="pointer-events-none absolute top-2 right-2 hidden gap-1.5 group-hover:flex">
          <HoverButton label="Use in chat" disabled={busy} onClick={() => void useInChat(src, name, attachmentId ?? meta.attachmentId, setBusy)}>
            <ImagePlus className="size-3.5" />
          </HoverButton>
          <HoverButton label="Download" onClick={() => void downloadImage(src, name)}>
            <Download className="size-3.5" />
          </HoverButton>
        </span>
      </span>
      {open
        ? createPortal(
            <ImagePreviewDialog
              src={src}
              name={name}
              prompt={displayPrompt(meta.prompt, generated)}
              createdAt={meta.createdAt}
              source={meta.source ?? "Generated in chat"}
              onClose={() => setOpen(false)}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function HoverButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className="pointer-events-auto flex size-8 items-center justify-center rounded-lg bg-[#1b1b1b]/80 text-white hover:bg-[#1b1b1b]"
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function ImagePreviewDialog({
  src,
  name,
  prompt,
  createdAt,
  source,
  onClose,
}: {
  src: string;
  name: string;
  prompt?: string;
  createdAt?: string;
  source: string;
  onClose: () => void;
}) {
  const [favorite, setFavorite] = useState(false);
  const [copied, setCopied] = useState<"prompt" | "link" | null>(null);
  const [size, setSize] = useState<string>("");

  async function copy(value: string, which: "prompt" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-8" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Image Preview"
        className="flex h-[min(680px,88vh)] w-[min(1040px,100%)] overflow-hidden rounded-[28px] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex min-w-0 flex-1 flex-col px-8 pt-7 pb-8">
          <div className="text-[16px] font-bold text-[#1b1b1b]">Image Preview</div>
          <div className="absolute top-6 right-6 flex gap-2">
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              aria-label="Expand image"
              className="flex size-9 items-center justify-center rounded-xl border border-[#e6e6e6] text-[#1b1b1b] hover:bg-[#fafafa]"
            >
              <Maximize2 className="size-3.5" />
            </a>
            <button
              type="button"
              aria-label="Close preview"
              className="flex size-9 items-center justify-center rounded-xl border border-[#e6e6e6] text-[#1b1b1b] hover:bg-[#fafafa]"
              onClick={onClose}
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={name}
              className="max-h-full max-w-[280px] rounded-2xl object-contain"
              onLoad={(event) => {
                const image = event.currentTarget;
                if (image.naturalWidth) setSize(`${image.naturalWidth} X ${image.naturalHeight}`);
              }}
            />
          </div>
        </div>
        <div className="flex w-[340px] shrink-0 flex-col px-6 pt-8 pb-6">
          <FieldLabel icon={<FileText className="size-3.5" />} label="Prompt">
            <button type="button" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#404040] hover:text-[#1b1b1b]" onClick={() => void copy(prompt || "", "prompt")}>
              {copied === "prompt" ? "Copied" : "Copy"}
              <Copy className="size-3.5" />
            </button>
          </FieldLabel>
          <div className="mt-2 rounded-2xl bg-[#f3f3f5] px-4 py-3 text-[14px] font-semibold text-[#1b1b1b]">{prompt || "AI generated media"}</div>
          <FieldLabel icon={<FileText className="size-3.5" />} label="File Name" className="mt-5">
            <Pencil className="size-3.5 text-[#404040]" />
          </FieldLabel>
          <div className="mt-2 rounded-2xl bg-[#f3f3f5] px-4 py-3 text-[14px] font-semibold text-[#1b1b1b]">{name}</div>
          <MetaRow icon={<Calendar className="size-3.5" />} label="Created on" value={formatCreated(createdAt)} />
          <MetaRow icon={<Hash className="size-3.5" />} label="Source" value={source} />
          <MetaRow icon={<Proportions className="size-3.5" />} label="Dimensions" value={size || "—"} />
          <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
            <ActionButton onClick={() => setFavorite((value) => !value)}>
              <Heart className={cn("size-3.5", favorite && "fill-[#1b1b1b]")} />
              {favorite ? "Favorited" : "Add to Favorite"}
            </ActionButton>
            <ActionButton onClick={() => void copy(src, "link")}>
              <Copy className="size-3.5" />
              {copied === "link" ? "Copied" : "Copy Link"}
            </ActionButton>
            <ActionButton onClick={() => void downloadImage(src, name)}>
              <Download className="size-3.5" />
              Download
            </ActionButton>
            <ActionButton tone="danger" onClick={onClose}>
              <Trash2 className="size-3.5" />
              Delete File
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({
  icon,
  label,
  children,
  className,
}: {
  icon: ReactNode;
  label: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between text-[13px] font-semibold text-[#1b1b1b]", className)}>
      <span className="inline-flex items-center gap-2">
        <span className="text-[#404040]">{icon}</span>
        {label}
      </span>
      {children}
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3 text-[13px] font-semibold">
      <span className="inline-flex items-center gap-2 text-[#1b1b1b]">
        <span className="text-[#404040]">{icon}</span>
        {label}
      </span>
      <span className="text-right font-semibold text-[#1b1b1b]">{value}</span>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  tone,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-3 text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#fafafa]",
        tone === "danger" && "text-[#e11d48]",
      )}
    >
      {children}
    </button>
  );
}

async function useInChat(
  url: string,
  name: string,
  attachmentId: string | undefined,
  setBusy: (busy: boolean) => void,
) {
  const store = useComposerStore.getState();
  setBusy(true);
  try {
    const id = attachmentId ?? (await uploadApi.reference(url)).id;
    store.addAttachmentIds([id]);
    store.upsertPendingFile({
      id,
      name,
      previewUrl: url,
      progress: 100,
      status: "complete",
      attachmentId: id,
    });
  } catch (error) {
    store.setError(error instanceof Error ? error.message : "Could not add that image to the composer.");
  } finally {
    setBusy(false);
  }
}

async function downloadImage(url: string, name: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = name;
    link.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function displayPrompt(prompt: string | undefined, generated: boolean): string {
  const cleaned = (prompt ?? "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned && generated) return "AI generated media";
  return cleaned || "AI generated media";
}

function displayFileName(name: string | undefined, url: string, generated: boolean): string {
  if (generated && (!name || /^cropped image$/i.test(name) || name === "Uploaded image")) {
    return "ai-generated-image";
  }
  if (name && !name.includes("://")) return name;
  return fileNameFromUrl(url);
}

function fileNameFromUrl(url: string): string {
  try {
    const name = new URL(url).pathname.split("/").pop();
    return name && name.length > 0 ? decodeURIComponent(name) : "image";
  } catch {
    return "image";
  }
}

function formatCreated(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
}
