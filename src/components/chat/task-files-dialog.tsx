"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useChatFilesQuery } from "@/hooks/use-queries";
import type { LibraryAttachment } from "@/lib/api/schemas";
import { dayGroupLabel, fileKindLabel, fileKindTab, formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "all" | "documents" | "images" | "videos" | "audio" | "code";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "all", label: "All" },
  { id: "documents", label: "Documents" },
  { id: "images", label: "Images" },
  { id: "videos", label: "Videos" },
  { id: "audio", label: "Audio" },
  { id: "code", label: "Code files" },
];

export function TaskFilesDialog({
  chatId,
  open,
  onOpenChange,
}: {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const files = useChatFilesQuery(chatId, open);
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (files.hasNextPage && !files.isFetchingNextPage) {
      void files.fetchNextPage();
    }
  }, [files.hasNextPage, files.isFetchingNextPage, files.fetchNextPage]);

  useEffect(() => {
    if (!open) {
      setTab("all");
      setSelected([]);
    }
  }, [open]);

  const items = useMemo(
    () => files.data?.pages.flatMap((page) => page.items) ?? [],
    [files.data?.pages],
  );
  const counts = useMemo(() => {
    const next = { all: items.length, documents: 0, images: 0, videos: 0, audio: 0, code: 0 };
    for (const item of items) next[fileKindTab(item.mimeType, item.filename)] += 1;
    return next;
  }, [items]);
  const visible = useMemo(
    () => (tab === "all" ? items : items.filter((item) => fileKindTab(item.mimeType, item.filename) === tab)),
    [items, tab],
  );
  const groups = useMemo(() => groupByDay(visible), [visible]);
  const allSelected = visible.length > 0 && visible.every((item) => selected.includes(item.id));

  function toggleAll() {
    setSelected(allSelected ? [] : visible.map((item) => item.id));
  }

  function download(targets: LibraryAttachment[]) {
    for (const item of targets) {
      if (!item.url) continue;
      const link = document.createElement("a");
      link.href = item.url;
      link.download = item.filename || "file";
      link.rel = "noreferrer";
      link.target = "_blank";
      document.body.append(link);
      link.click();
      link.remove();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(640px,86vh)] w-[min(640px,94vw)] max-w-none flex-col gap-0 overflow-hidden rounded-[32px] bg-background p-0 text-foreground shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:max-w-none"
      >
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3">
          <DialogTitle className="text-[16px] font-semibold tracking-[-0.02em]">
            All files in this task
          </DialogTitle>
          <div className="flex items-center gap-3 text-[13px] font-medium text-muted-foreground">
            <button type="button" className="hover:text-foreground" onClick={toggleAll}>
              {allSelected ? "Deselect all" : "Select all"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 hover:text-foreground"
              onClick={() => {
                const chosen = selected.length
                  ? visible.filter((item) => selected.includes(item.id))
                  : visible;
                download(chosen);
              }}
            >
              <Download className="size-3.5" />
              Download all
            </button>
            <button
              type="button"
              aria-label="Close"
              className="flex size-7 items-center justify-center rounded-full hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 pb-3">
          {TABS.map((item) => {
            const count = counts[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium",
                  tab === item.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                {item.label}
                {count ? ` ${count}` : ""}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {groups.length ? (
            groups.map((group) => (
              <section key={group.label} className="mb-5">
                <h3 className="mb-2 text-[12px] font-medium text-muted-foreground">{group.label}</h3>
                <ul className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const checked = selected.includes(item.id);
                    const kind = fileKindLabel(item.mimeType, item.filename);
                    const size = formatBytes(item.byteSize);
                    const when = dayGroupLabel(item.createdAt);
                    const src = item.thumbnailUrl || item.url || "";
                    const image = Boolean(src) && item.mimeType.startsWith("image/");
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          aria-pressed={checked}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl px-1 py-1.5 text-left hover:bg-muted",
                            checked && "bg-muted",
                          )}
                          onClick={() =>
                            setSelected((current) =>
                              current.includes(item.id)
                                ? current.filter((id) => id !== item.id)
                                : [...current, item.id],
                            )
                          }
                        >
                          <span className="size-10 shrink-0 overflow-hidden rounded-xl bg-[#111]">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={src} alt="" className="size-10 object-cover" />
                            ) : (
                              <span className="flex size-10 items-center justify-center text-[9px] font-semibold uppercase text-white/70">
                                {kind.slice(0, 3)}
                              </span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold">
                              {item.filename || "Untitled"}
                            </span>
                            <span className="block truncate text-[12px] font-medium text-muted-foreground">
                              {kind} - {when}
                              {size ? ` · ${size}` : ""}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          ) : (
            <p className="py-16 text-center text-[13px] font-medium text-muted-foreground">
              {files.isLoading ? "Loading files…" : "No files in this task yet."}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function groupByDay(items: LibraryAttachment[]): Array<{ label: string; items: LibraryAttachment[] }> {
  const groups = new Map<string, LibraryAttachment[]>();
  for (const item of items) {
    const label = dayGroupLabel(item.createdAt);
    const bucket = groups.get(label) ?? [];
    bucket.push(item);
    groups.set(label, bucket);
  }
  return [...groups.entries()].map(([label, grouped]) => ({ label, items: grouped }));
}
