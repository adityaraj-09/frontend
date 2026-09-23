"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Calendar, Copy, Download, FileText, Hash, Heart, ImagePlus, Link2, Maximize2, Pencil, Proportions, Trash2, X } from "lucide-react";
import { uploadApi } from "@/lib/api/services";
import { useComposerStore } from "@/stores/composer";
import { useLibraryFavorites } from "@/stores/library";
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
  prompt,
  className,
}: {
  src?: string;
  alt?: string;
  filename?: string;
  attachmentId?: string;
  prompt?: string;
  className?: string;
}) {
  const meta = useContext(ChatImageMetaContext);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!src) return null;
  const generated = (meta.source ?? "Generated in chat") === "Generated in chat";
  const name = displayFileName(filename || alt, src, generated);
  const resolvedPrompt = displayPrompt(prompt ?? meta.prompt, generated);

  return (
    <>
      <span className="group relative inline-block w-fit max-w-full self-start align-top">
        <button
          type="button"
          className="block"
          onClick={() => setOpen(true)}
          aria-label={`Preview ${name}`}
        >
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
              prompt={resolvedPrompt}
              createdAt={meta.createdAt}
              source={meta.source ?? "Generated in chat"}
              attachmentId={attachmentId ?? meta.attachmentId}
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
      className="pointer-events-auto flex size-8 items-center justify-center rounded-lg bg-foreground/80 text-white hover:bg-foreground"
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

export function ImagePreviewDialog({
  src,
  name,
  prompt,
  createdAt,
  source,
  attachmentId,
  onClose,
}: {
  src: string;
  name: string;
  prompt?: string;
  createdAt?: string;
  source: string;
  attachmentId?: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [localFavorite, setLocalFavorite] = useState(false);
  const [copied, setCopied] = useState<"prompt" | "link" | null>(null);
  const [size, setSize] = useState<string>("");
  const favoriteIds = useLibraryFavorites((s) => s.ids);
  const toggleFavorite = useLibraryFavorites((s) => s.toggle);
  const favorited = attachmentId ? favoriteIds.includes(attachmentId) : localFavorite;

  async function copy(value: string, which: "prompt" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      setCopied(null);
    }
  }

  async function useAsReference() {
    const attached = await useInChat(src, name, attachmentId, setBusy);
    if (attached) onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-6 md:p-10" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image Preview"
        className="flex h-[min(800px,92vh)] w-[min(1180px,96vw)] overflow-hidden rounded-[28px] bg-background shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex min-w-0 flex-1 flex-col px-8 pt-7 pb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[16px] font-semibold tracking-[-0.02em] text-foreground">Image Preview</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void useAsReference()}
                className="h-8 rounded-full bg-foreground px-3.5 text-[12px] font-semibold text-background disabled:opacity-60"
              >
                Use as reference
              </button>
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                aria-label="Expand image"
                className="flex size-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
              >
                <Maximize2 className="size-3.5" />
              </a>
              <button
                type="button"
                aria-label="Close preview"
                className="flex size-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
                onClick={onClose}
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-4 flex min-h-0 flex-1 items-center justify-center">
            <div className="relative max-h-full max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={name}
                className="max-h-full max-w-full rounded-2xl object-contain"
                onLoad={(event) => {
                  const image = event.currentTarget;
                  if (image.naturalWidth) setSize(`${image.naturalWidth} X ${image.naturalHeight}`);
                }}
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  aria-label={copied === "link" ? "Copied link" : "Copy link"}
                  className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-muted"
                  onClick={() => void copy(src, "link")}
                >
                  <Link2 className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Download image"
                  className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-muted"
                  onClick={() => void downloadImage(src, name)}
                >
                  <Download className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
                  aria-pressed={favorited}
                  className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-muted"
                  onClick={() => {
                    if (attachmentId) toggleFavorite(attachmentId);
                    else setLocalFavorite((value) => !value);
                  }}
                >
                  <Heart className={cn("size-4", favorited && "fill-foreground")} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-[320px] shrink-0 flex-col px-6 pt-8 pb-6">
          <FieldLabel icon={<FileText className="size-3.5" />} label="Prompt">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
              onClick={() => void copy(prompt || "", "prompt")}
            >
              {copied === "prompt" ? "Copied" : "Copy"}
              <Copy className="size-3.5" />
            </button>
          </FieldLabel>
          <div className="mt-2 rounded-2xl bg-muted px-4 py-3 text-[14px] font-semibold text-foreground">
            {prompt || "AI generated media"}
          </div>
          <FieldLabel icon={<FileText className="size-3.5" />} label="File Name" className="mt-6">
            <Pencil className="size-3.5 text-muted-foreground" />
          </FieldLabel>
          <div className="mt-2 rounded-2xl bg-muted px-4 py-3 text-[14px] font-semibold text-foreground">{name}</div>
          <MetaRow icon={<Calendar className="size-3.5" />} label="Created on" value={formatCreated(createdAt)} />
          <MetaRow icon={<Hash className="size-3.5" />} label="Source" value={source} />
          <MetaRow icon={<Proportions className="size-3.5" />} label="Dimensions" value={size || "—"} />
          <div className="mt-auto grid grid-cols-2 gap-2.5 pt-10">
            <ActionButton
              onClick={() => {
                if (attachmentId) toggleFavorite(attachmentId);
                else setLocalFavorite((value) => !value);
              }}
            >
              <Heart className={cn("size-3.5", favorited && "fill-foreground")} />
              {favorited ? "Favorited" : "Add to Favorite"}
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
    <div className={cn("flex items-center justify-between text-[13px] font-semibold text-foreground", className)}>
      <span className="inline-flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </span>
      {children}
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3 text-[13px] font-semibold">
      <span className="inline-flex items-center gap-2 text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </span>
      <span className="text-right font-semibold text-foreground">{value}</span>
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
        "flex h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] font-semibold text-foreground hover:bg-muted",
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
    return true;
  } catch (error) {
    store.setError(error instanceof Error ? error.message : "Could not add that image to the composer.");
    return false;
  } finally {
    setBusy(false);
  }
}

export async function downloadImage(url: string, name: string) {
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
