"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, useUser } from "@/lib/clerk";
import {
  BookOpen,
  Boxes,
  CirclePlus,
  FolderOpen,
  Library,
  LifeBuoy,
  MessageSquareMore,
  PanelLeft,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { MagicaMark, MagicaWordmark } from "@/components/brand/magica-mark";
import { ChatRow } from "@/components/shell/chat-row";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { UpdatesDialog } from "@/components/shell/updates-dialog";
import { useChatsQuery } from "@/hooks/use-queries";
import { useUiStore } from "@/stores/ui";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

const NAV = [
  { href: "/", label: "New task", icon: CirclePlus },
  { href: "/tasks", label: "Tasks", icon: MessageSquareMore },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/library", label: "Library", icon: Library },
  { href: "/tools", label: "Tools", icon: Boxes },
  { href: "/api-docs", label: "API / MCP", icon: BookOpen },
  { href: "/help", label: "Help & Support", icon: LifeBuoy },
  { href: "/advantage", label: "Unfair Advantage", icon: Sparkles },
] as const;

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const { user } = useUser();
  const searchOpen = useUiStore((s) => s.searchOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const setSettingsTab = useUiStore((s) => s.setSettingsTab);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const chats = useChatsQuery(searchQuery);

  const all = chats.data?.pages.flatMap((page) => page.items) ?? [];
  const pinned = all.filter((chat) => chat.isFavorite).slice(0, 12);
  const recent = all.filter((chat) => !chat.isFavorite).slice(0, 12);

  if (collapsed) {
    return (
      <aside className="flex h-full w-14 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-2.5 text-sidebar-foreground">
        <button
          type="button"
          aria-label="Expand sidebar"
          className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-sidebar-accent"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="flex size-5 items-center justify-center rounded-[5px] bg-foreground text-background">
            <MagicaMark />
          </span>
        </button>
        <button
          type="button"
          aria-label="Search tasks"
          className="mt-1 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          onClick={() => {
            setSidebarOpen(true);
            setSearchOpen(true);
          }}
        >
          <Search className="size-4" strokeWidth={2} />
        </button>
        <nav className="mt-1 flex flex-col items-center gap-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.href !== "/" && (pathname === item.href || pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-muted-foreground",
                  active ? "bg-sidebar-accent text-foreground" : "hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={2} />
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          aria-label="Settings"
          className="mt-auto flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          onClick={() => {
            setSettingsTab("account");
            setSettingsOpen(true);
          }}
        >
          <Settings className="size-4" strokeWidth={2} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-[14px] leading-5 text-sidebar-foreground">
      <div className="flex h-[52px] items-center justify-between pl-3 pr-2 pt-2.5">
        <Link href="/" className="flex h-8 items-center rounded-[10px] px-0.5" aria-label="Magica home">
          <MagicaWordmark />
        </Link>
        <div className="flex items-center text-muted-foreground">
          <button
            type="button"
            aria-label="Search tasks"
            className="flex size-7 items-center justify-center rounded-full hover:bg-sidebar-accent"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Collapse sidebar"
            className="flex size-7 items-center justify-center rounded-[10px] hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <PanelLeft className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="px-3 pb-2">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks"
            className="h-8 rounded-lg border-border bg-background text-sm"
          />
        </div>
      ) : null}

      <nav className="flex flex-col gap-1 px-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.href !== "/" && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-[34px] items-center gap-2.5 rounded-[10px] px-2 text-[14px] font-semibold leading-5 tracking-normal text-muted-foreground",
                active ? "bg-sidebar-accent text-foreground" : "hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <SignedOut>
          <div className="px-2 text-[11px] font-semibold leading-[16.5px] text-muted-foreground">Recent tasks</div>
          <p className="px-2 py-3 text-[12px] font-medium leading-5 text-muted-foreground">Sign in to see your tasks.</p>
        </SignedOut>
        <SignedIn>
          {pinned.length ? (
            <>
              <div className="px-2 text-[11px] font-semibold leading-[16.5px] text-muted-foreground">Pinned</div>
              <div className="mt-1">
                {pinned.map((chat) => (
                  <ChatRow key={chat.id} chat={chat} active={pathname === `/chat/${chat.id}`} />
                ))}
              </div>
            </>
          ) : null}
          <div className={cn("px-2 text-[11px] font-semibold leading-[16.5px] text-muted-foreground", pinned.length && "mt-4")}>
            Recent tasks
          </div>
          <div className="mt-1">
            {recent.map((chat) => (
              <ChatRow key={chat.id} chat={chat} active={pathname === `/chat/${chat.id}`} />
            ))}
          </div>
        </SignedIn>
      </div>

      <div className="mt-auto flex flex-col gap-1.5 p-2">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-background text-[13px] font-semibold text-foreground hover:bg-muted"
            onClick={() => {
              setSettingsTab("account");
              setSettingsOpen(true);
            }}
          >
            <Settings className="size-3.5" strokeWidth={1.75} />
            Settings
          </button>
          <button
            type="button"
            className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-background text-[13px] font-semibold text-foreground hover:bg-muted"
            onClick={() => setUpdatesOpen(true)}
          >
            <Sparkles className="size-3.5" strokeWidth={1.75} />
            Updates
          </button>
        </div>
        <ThemeToggle />
        <SignedOut>
          <Link
            href="/sign-in"
            className="flex h-10 w-full items-center justify-center rounded-full border border-border bg-background text-[13px] font-semibold text-foreground hover:bg-muted"
          >
            Sign in
          </Link>
        </SignedOut>
        <SignedIn>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between rounded-full border border-border bg-background px-2 text-left hover:bg-muted"
            onClick={() => {
              setSettingsTab("account");
              setSettingsOpen(true);
            }}
          >
            <Avatar className="size-6">
              <AvatarImage src={user?.imageUrl} alt="" />
              <AvatarFallback className="text-[10px]">
                {user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate pl-2 text-[13px] font-semibold leading-5 text-foreground">
              {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
            </span>
          </button>
        </SignedIn>
        <UpdatesDialog open={updatesOpen} onOpenChange={setUpdatesOpen} />
      </div>
    </aside>
  );
}
