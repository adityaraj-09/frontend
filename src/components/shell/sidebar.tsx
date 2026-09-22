"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignedIn, SignedOut, useClerk, useUser } from "@/lib/clerk";
import {
  BookOpen,
  Boxes,
  CirclePlus,
  EllipsisVertical,
  FolderOpen,
  Library,
  LifeBuoy,
  LogOut,
  MessageSquareMore,
  PanelLeft,
  Search,
  Sparkles,
} from "lucide-react";
import { MagicaWordmark } from "@/components/brand/magica-mark";
import { ChatRow } from "@/components/shell/chat-row";
import { useChatsQuery } from "@/hooks/use-queries";
import { useUiStore } from "@/stores/ui";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const searchOpen = useUiStore((s) => s.searchOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const chats = useChatsQuery(searchQuery);

  const all = chats.data?.pages.flatMap((page) => page.items) ?? [];
  const pinned = all.filter((chat) => chat.isFavorite).slice(0, 12);
  const recent = all.filter((chat) => !chat.isFavorite).slice(0, 12);

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[#ededed] bg-[#fafafa] text-[14px] leading-5">
      <div className="flex h-[52px] items-center justify-between pl-3 pr-2 pt-2.5">
        <Link href="/" className="flex h-8 items-center rounded-[10px] px-0.5" aria-label="Magica home">
          <MagicaWordmark />
        </Link>
        <div className="flex items-center text-[#585858]">
          <button
            type="button"
            aria-label="Search tasks"
            className="flex size-7 items-center justify-center rounded-full hover:bg-[#f1f1f1]"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Collapse sidebar"
            className="flex size-7 items-center justify-center rounded-[10px] hover:bg-[#f1f1f1]"
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
            className="h-8 rounded-lg border-[#ededed] bg-white text-sm"
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
                "flex h-[34px] items-center gap-2.5 rounded-[10px] px-2 text-[14px] font-medium leading-5 tracking-normal text-[#585858]",
                active ? "bg-[#f1f1f1] text-[#1b1b1b]" : "hover:bg-[#f1f1f1] hover:text-[#1b1b1b]",
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
          <div className="px-2 text-[11px] leading-[16.5px] text-[#777777]">Recent tasks</div>
          <p className="px-2 py-3 text-[12px] leading-5 text-[#a1a1aa]">Sign in to see your tasks.</p>
        </SignedOut>
        <SignedIn>
          {pinned.length ? (
            <>
              <div className="px-2 text-[11px] leading-[16.5px] text-[#777777]">Pinned</div>
              <div className="mt-1">
                {pinned.map((chat) => (
                  <ChatRow key={chat.id} chat={chat} active={pathname === `/chat/${chat.id}`} />
                ))}
              </div>
            </>
          ) : null}
          <div className={cn("px-2 text-[11px] leading-[16.5px] text-[#777777]", pinned.length && "mt-4")}>
            Recent tasks
          </div>
          <div className="mt-1">
            {recent.map((chat) => (
              <ChatRow key={chat.id} chat={chat} active={pathname === `/chat/${chat.id}`} />
            ))}
          </div>
        </SignedIn>
      </div>

      <div className="mt-auto border-t border-[#ededed] p-2">
        <SignedOut>
          <Link
            href="/sign-in"
            className="flex h-[34px] w-full items-center rounded-[10px] px-2 text-[14px] font-medium text-[#1b1b1b] hover:bg-[#f1f1f1]"
          >
            Sign in
          </Link>
        </SignedOut>
        <SignedIn>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-[34px] w-full items-center gap-2.5 rounded-[10px] px-2 text-[14px] font-normal leading-5 text-[#585858] hover:bg-[#f1f1f1] hover:text-[#1b1b1b]">
              <EllipsisVertical className="size-4" strokeWidth={2} />
              More
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem
                onClick={() => {
                  void signOut({ redirectUrl: "/" });
                  router.push("/");
                }}
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            className="mt-1 flex h-10 w-full items-center gap-2 rounded-[16px] border border-[#ededed] bg-white px-2 text-left"
            onClick={() => openUserProfile()}
          >
            <Avatar className="size-6">
              <AvatarImage src={user?.imageUrl} alt="" />
              <AvatarFallback className="text-[10px]">
                {user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-[14px] leading-5 text-[#1b1b1b]">
              {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
            </span>
          </button>
        </SignedIn>
      </div>
    </aside>
  );
}
