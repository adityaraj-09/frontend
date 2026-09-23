"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { Chat } from "@/lib/api/schemas";
import { useToggleFavorite } from "@/hooks/use-queries";
import { cn } from "@/lib/utils";

export function ChatRow({
  chat,
  active,
  compact = true,
}: {
  chat: Chat;
  active?: boolean;
  compact?: boolean;
}) {
  const toggle = useToggleFavorite();
  const pinned = chat.isFavorite;

  return (
    <div
      className={cn(
        "group flex items-center gap-0.5",
        compact ? "mb-0.5 rounded-lg" : "border-b border-border py-2",
        compact && active && "bg-sidebar-accent",
        compact && !active && "hover:bg-sidebar-accent/70",
      )}
    >
      <Link
        href={`/chat/${chat.id}`}
        className={cn(
          "min-w-0 flex-1 truncate",
          compact
            ? cn("px-2 py-1.5 text-[13px] font-semibold leading-5", active ? "text-foreground" : "text-muted-foreground")
            : "py-1 text-[13px] font-semibold hover:text-foreground",
        )}
      >
        {chat.title || "New chat"}
        {!compact ? (
          <div className="text-[12px] font-medium text-muted-foreground">{new Date(chat.lastMessageAt).toLocaleString()}</div>
        ) : null}
      </Link>
      <button
        type="button"
        aria-label={pinned ? "Unpin chat" : "Pin chat"}
        aria-pressed={pinned}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
          pinned ? "text-foreground opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          pinned && "opacity-100",
        )}
        onClick={() => toggle.mutate({ id: chat.id, isFavorite: !pinned })}
      >
        <Star className={cn("size-3.5", pinned && "fill-current")} />
      </button>
    </div>
  );
}
