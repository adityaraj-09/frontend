"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpDown,
  Download,
  Folder,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useLibraryQuery } from "@/hooks/use-queries";
import { useUppyUpload } from "@/hooks/use-uppy-upload";
import { useLibraryFavorites } from "@/stores/library";
import { useComposerStore } from "@/stores/composer";
import { downloadImage, ImagePreviewDialog } from "@/components/chat/chat-image";
import type { LibraryAttachment } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tab = "all" | "generated" | "uploads" | "favorites";
type Sort = "newest" | "oldest" | "name";
type Kind = "all" | "image" | "video" | "audio";
type Density = "grid" | "list";

export function LibraryBrowser({
  mode = "browse",
  onPick,
}: {
  mode?: "browse" | "pick";
  onPick?: (item: LibraryAttachment) => void;
}) {
  const library = useLibraryQuery();
  const upload = useUppyUpload();
  const pendingFiles = useComposerStore((s) => s.pendingFiles);
  const queue = pendingFiles.filter((file) => file.status === "uploading" || file.status === "error");
  const uploadingCount = queue.filter((file) => file.status === "uploading").length;
  const fileRef = useRef<HTMLInputElement>(null);
  const persistedFavorites = useLibraryFavorites((s) => s.ids);
  const toggleFavorite = useLibraryFavorites((s) => s.toggle);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  const favorites = hydrated ? persistedFavorites : [];
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [kind, setKind] = useState<Kind>("all");
  const [density, setDensity] = useState<Density>("grid");
  const [preview, setPreview] = useState<LibraryAttachment | null>(null);

  const items = useMemo(
    () => library.data?.pages.flatMap((page) => page.items) ?? [],
    [library.data?.pages],
  );

  useEffect(() => {
    if (library.hasNextPage && !library.isFetchingNextPage) {
      void library.fetchNextPage();
    }
  }, [library.hasNextPage, library.isFetchingNextPage, library.fetchNextPage]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (tab === "generated" && item.origin !== "GENERATED") return false;
      if (tab === "uploads" && item.origin === "GENERATED") return false;
      if (tab === "favorites" && !favorites.includes(item.id)) return false;
      if (kind === "image" && !item.mimeType.startsWith("image/")) return false;
      if (kind === "video" && !item.mimeType.startsWith("video/")) return false;
      if (kind === "audio" && !item.mimeType.startsWith("audio/")) return false;
      if (q && !item.filename.toLowerCase().includes(q)) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === "name") return a.filename.localeCompare(b.filename);
      const left = new Date(a.createdAt ?? 0).getTime();
      const right = new Date(b.createdAt ?? 0).getTime();
      return sort === "oldest" ? left - right : right - left;
    });
  }, [items, tab, kind, query, sort, favorites]);

  const groups = useMemo(() => groupByDay(visible), [visible]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <div className="flex shrink-0 items-center justify-between gap-3 px-6 pt-5 pb-3">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Library</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] font-medium text-foreground">
              Sort
              <ArrowUpDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort("newest")}>Newest</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("oldest")}>Oldest</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("name")}>Name</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] font-medium text-foreground">
              Filter
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setKind("all")}>All types</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setKind("image")}>Images</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setKind("video")}>Videos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setKind("audio")}>Audio</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            aria-label={density === "grid" ? "List view" : "Grid view"}
            className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground"
            onClick={() => setDensity((value) => (value === "grid" ? "list" : "grid"))}
          >
            {density === "grid" ? <LayoutGrid className="size-3.5" /> : <List className="size-3.5" />}
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-[13px] font-semibold text-white"
            onClick={() => fileRef.current?.click()}
          >
            Upload media
            <Upload className="size-3.5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={(event) => {
              const files = event.target.files;
              if (files?.length) upload.addFiles(files);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="px-6">
        <label className="flex h-10 items-center gap-2 rounded-full bg-muted px-3.5">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search media..."
            className="h-full w-full bg-transparent text-[14px] font-medium text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <p className="mt-3 text-[13px] font-medium text-muted-foreground">
          {items.length} {items.length === 1 ? "file" : "files"}
          {uploadingCount
            ? ` • ${uploadingCount} upload${uploadingCount === 1 ? "" : "s"} in progress`
            : ""}
        </p>
      </div>

      <div className="mt-2 flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto px-6 pb-8">
          <div className="flex flex-wrap items-center gap-5 border-b border-border pb-2 text-[13px] font-medium text-muted-foreground">
            <TabButton active={tab === "all"} onClick={() => setTab("all")} icon={<LayoutGrid className="size-3.5" />}>
              All
            </TabButton>
            <TabButton active={tab === "generated"} onClick={() => setTab("generated")} icon={<Sparkles className="size-3.5" />}>
              Generated
            </TabButton>
            <TabButton active={tab === "uploads"} onClick={() => setTab("uploads")} icon={<ImageIcon className="size-3.5" />}>
              My Uploads
            </TabButton>
            <TabButton active={tab === "favorites"} onClick={() => setTab("favorites")} icon={<Heart className="size-3.5" />}>
              Favorites
            </TabButton>
          </div>

          {queue.length ? (
            <section className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-semibold text-foreground">Upload queue</h2>
                <p className="text-[13px] font-medium text-muted-foreground">
                  {uploadingCount} in progress
                </p>
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {queue.map((file) => (
                  <li
                    key={file.id}
                    className="flex h-12 items-center gap-3 rounded-full border border-border bg-background px-4"
                  >
                    {file.status === "uploading" ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <X className="size-4 shrink-0 text-[#b42318]" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                      {file.name}
                    </span>
                    <span className="shrink-0 text-[13px] font-medium text-muted-foreground">
                      {file.status === "error" ? file.error || "Failed" : "Uploading..."}
                    </span>
                    {file.status === "error" ? (
                      <button
                        type="button"
                        className="shrink-0 text-[13px] font-semibold text-foreground"
                        onClick={() => upload.retry(file.id)}
                      >
                        Retry
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => upload.cancel(file.id)}
                    >
                      <X className="size-3.5" />
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {library.isError ? (
            <p role="alert" className="mt-8 text-[13px] text-[#b42318]">
              Could not load the library. Refresh and try again.
            </p>
          ) : null}

          {!visible.length && !library.isError && !library.isLoading && !library.isFetching ? (
            <p className="mt-10 text-[13px] font-medium text-muted-foreground">
              {tab === "favorites"
                ? "No favorites yet."
                : "Nothing in the library yet. Upload media to see it here."}
            </p>
          ) : null}

          {groups.map((group) => (
            <section key={group.label} className="mt-6">
              <div className="mb-3">
                <h2 className="text-[16px] font-semibold text-foreground">{group.label}</h2>
                <p className="text-[12px] font-medium text-muted-foreground">{group.items.length} items</p>
              </div>
              <div
                className={cn(
                  density === "grid"
                    ? "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4"
                    : "flex flex-col gap-2",
                )}
              >
                {group.items.map((item) => (
                  <LibraryTile
                    key={item.id}
                    item={item}
                    density={density}
                    favorited={favorites.includes(item.id)}
                    selectable={mode === "pick"}
                    onFavorite={() => toggleFavorite(item.id)}
                    onOpen={() => {
                      if (mode === "pick") onPick?.(item);
                      else if (item.url && item.mimeType.startsWith("image/")) setPreview(item);
                      else if (item.url) window.open(item.url, "_blank", "noreferrer");
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="hidden w-[168px] shrink-0 border-l border-border px-4 pt-1 md:block">
          <button type="button" className="flex w-full items-center gap-2 py-1.5 text-left text-[13px] font-medium text-foreground">
            <LayoutGrid className="size-3.5" />
            All folders
          </button>
          <button type="button" className="flex w-full items-center gap-2 py-1.5 text-left text-[13px] font-medium text-muted-foreground">
            <Folder className="size-3.5" />
            My folders
          </button>
        </aside>
      </div>
      {preview?.url
        ? createPortal(
            <ImagePreviewDialog
              src={preview.url}
              name={preview.filename}
              createdAt={preview.createdAt}
              source={preview.origin === "GENERATED" ? "Generated in chat" : "Uploaded"}
              attachmentId={preview.id}
              onClose={() => setPreview(null)}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 py-2",
        active ? "text-foreground" : "text-muted-foreground hover:text-muted-foreground",
      )}
    >
      {icon}
      {children}
      {active ? <span className="absolute inset-x-0 -bottom-2 h-px bg-foreground" /> : null}
    </button>
  );
}

function LibraryTile({
  item,
  density,
  favorited,
  selectable,
  onFavorite,
  onOpen,
}: {
  item: LibraryAttachment;
  density: Density;
  favorited: boolean;
  selectable: boolean;
  onFavorite: () => void;
  onOpen: () => void;
}) {
  const src = item.thumbnailUrl || item.url || "";
  const image = Boolean(src) && item.mimeType.startsWith("image/");
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!item.url) return;
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn(density === "list" && "flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-muted")}>
      <div
        className={cn(
          "group relative overflow-hidden bg-[#111]",
          density === "grid" ? "w-full rounded-xl" : "size-14 shrink-0 rounded-lg",
          selectable && "ring-offset-2 hover:ring-2 hover:ring-foreground",
        )}
      >
        <button type="button" onClick={onOpen} className="block w-full text-left">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={item.filename}
              className={cn("object-cover", density === "grid" ? "aspect-[16/10] w-full" : "size-14")}
            />
          ) : (
            <div
              className={cn(
                "flex items-center justify-center bg-muted text-[11px] font-medium text-muted-foreground",
                density === "grid" ? "aspect-[16/10] w-full px-2" : "size-14",
              )}
            >
              {item.filename}
            </div>
          )}
        </button>
        {density === "grid" ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <div className="pointer-events-auto flex items-center gap-1.5">
              <TileAction
                label={copied ? "Copied link" : "Copy link"}
                disabled={!item.url}
                onClick={() => void copyLink()}
              >
                <Link2 className="size-3.5" />
              </TileAction>
              <TileAction
                label="Download image"
                disabled={!item.url}
                onClick={() => item.url && void downloadImage(item.url, item.filename)}
              >
                <Download className="size-3.5" />
              </TileAction>
              <TileAction
                label={favorited ? "Remove from favorites" : "Add to favorites"}
                pressed={favorited}
                onClick={onFavorite}
              >
                <Heart className={cn("size-3.5", favorited && "fill-foreground text-foreground")} />
              </TileAction>
            </div>
          </div>
        ) : null}
      </div>
      <div className={cn("flex items-start justify-between gap-2", density === "grid" ? "mt-1.5" : "min-w-0 flex-1")}>
        <p className="min-w-0 truncate text-[12px] font-medium text-muted-foreground">{item.filename}</p>
        {density === "list" ? (
          <button
            type="button"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorited}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onFavorite}
          >
            <Heart className={cn("size-3.5", favorited && "fill-foreground text-foreground")} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function TileAction({
  label,
  children,
  onClick,
  disabled,
  pressed,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground disabled:opacity-50"
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

function groupByDay(items: LibraryAttachment[]): Array<{ label: string; items: LibraryAttachment[] }> {
  const groups = new Map<string, LibraryAttachment[]>();
  for (const item of items) {
    const label = dayLabel(item.createdAt);
    const bucket = groups.get(label) ?? [];
    bucket.push(item);
    groups.set(label, bucket);
  }
  return [...groups.entries()].map(([label, grouped]) => ({ label, items: grouped }));
}

function dayLabel(iso?: string): string {
  if (!iso) return "Earlier";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Earlier";
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const today = start(new Date());
  const then = start(date);
  if (then === today) return "Today";
  if (then === today - 86_400_000) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
