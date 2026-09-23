"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { SignedIn, SignedOut } from "@/lib/clerk";
import { useChatsQuery, useDeleteChats } from "@/hooks/use-queries";
import { formatAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TasksPage() {
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const chats = useChatsQuery(query, pinnedOnly);
  const remove = useDeleteChats();
  const items = chats.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1472px] px-8 pb-10 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[30px] font-bold leading-9 text-[#1b1b1b]">Tasks</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold leading-5 text-[#404040]">Filter by</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1 rounded-[10px] px-2 text-[14px] font-semibold leading-5 text-[#1b1b1b] hover:bg-[#f1f1f1]">
                {pinnedOnly ? "Pinned" : "All"}
                <ChevronDown className="size-3.5 text-[#404040]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setPinnedOnly(false)}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPinnedOnly(true)}>Pinned</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              aria-pressed={selecting}
              className={cn(
                "inline-flex h-8 items-center rounded-full border border-[#ededed] bg-white px-3 text-[14px] font-semibold leading-5 text-[#1b1b1b] hover:bg-[#fafafa]",
                selecting && "bg-[#f1f1f1]",
              )}
              onClick={() => {
                setSelecting((on) => !on);
                setSelected([]);
              }}
            >
              {selecting ? "Cancel" : "Select tasks"}
            </button>
            {selecting ? (
              <button
                type="button"
                disabled={!selected.length || remove.isPending}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#ededed] bg-white px-3 text-[14px] font-semibold text-[#e11d48] disabled:opacity-40"
                onClick={() => {
                  void remove.mutateAsync(selected).then(() => {
                    setSelected([]);
                    setSelecting(false);
                  });
                }}
              >
                <Trash2 className="size-3.5" />
                Delete {selected.length || ""}
              </button>
            ) : null}
            <Link
              href="/"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#1b1b1b] px-3 text-[14px] font-semibold leading-5 text-white"
            >
              <Plus className="size-4" strokeWidth={2} />
              New task
              <span className="ml-0.5 text-[11px] font-medium leading-none text-white/70">⌘⇧O</span>
            </Link>
          </div>
        </div>

        <label className="mt-5 flex h-11 items-center gap-2 rounded-xl bg-[#f7f7f7] px-3 text-[#404040]">
          <Search className="size-4 shrink-0" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks..."
            className="h-full w-full bg-transparent text-[14px] font-medium leading-5 text-[#1b1b1b] outline-none placeholder:text-[#585858]"
          />
        </label>

        <SignedOut>
          <p className="mt-6 text-[14px] font-medium leading-6 text-[#404040]">Sign in to see your recent tasks.</p>
          <Link
            href="/sign-in"
            className="mt-4 inline-flex h-8 items-center rounded-full bg-[#1b1b1b] px-3 text-[14px] font-semibold text-white"
          >
            Sign in
          </Link>
        </SignedOut>

        <SignedIn>
          <ul className="mt-2">
            {items.map((chat) => {
              const checked = selected.includes(chat.id);
              return (
                <li key={chat.id}>
                  <div className="flex h-12 items-center gap-3">
                    {selecting ? (
                      <button
                        type="button"
                        aria-pressed={checked}
                        aria-label={checked ? "Deselect task" : "Select task"}
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                          checked ? "border-[#1b1b1b] bg-[#1b1b1b] text-white" : "border-[#dedede] bg-white",
                        )}
                        onClick={() =>
                          setSelected((current) =>
                            current.includes(chat.id) ? current.filter((id) => id !== chat.id) : [...current, chat.id],
                          )
                        }
                      >
                        {checked ? <Check className="size-3" /> : null}
                      </button>
                    ) : null}
                    <Link href={`/chat/${chat.id}`} className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-5 text-[#1b1b1b]">
                      {chat.title || "New task"}
                    </Link>
                    <span className="shrink-0 text-[14px] font-medium leading-5 text-[#404040]">{formatAgo(chat.lastMessageAt)}</span>
                  </div>
                </li>
              );
            })}
            {!items.length ? (
              <li className="py-8 text-[14px] font-medium leading-6 text-[#404040]">
                {pinnedOnly ? "No pinned tasks yet." : query ? "No tasks found." : "No tasks yet. Start from New task."}
              </li>
            ) : null}
          </ul>
          {chats.hasNextPage ? (
            <button
              type="button"
              className="mt-2 text-[14px] font-semibold text-[#404040]"
              onClick={() => void chats.fetchNextPage()}
            >
              Load more
            </button>
          ) : null}
        </SignedIn>
      </div>
    </div>
  );
}
