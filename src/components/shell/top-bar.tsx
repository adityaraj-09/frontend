"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut } from "@/lib/clerk";
import { ChevronDown, Folder, PanelLeft } from "lucide-react";
import { MagicaMark } from "@/components/brand/magica-mark";
import { TaskFilesDialog } from "@/components/chat/task-files-dialog";
import { useMeQuery } from "@/hooks/use-queries";
import { useUiStore } from "@/stores/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditsPopover } from "./credits-popover";

function chatIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/chat\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  return match?.[1] ?? null;
}

export function TopBar() {
  const pathname = usePathname();
  const chatId = chatIdFromPath(pathname);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const { data: me } = useMeQuery();
  const [filesOpen, setFilesOpen] = useState(false);

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {!sidebarOpen ? (
          <button
            type="button"
            aria-label="Open sidebar"
            className="mr-1 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeft className="size-3.5" />
          </button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-7 max-w-[180px] items-center gap-2 rounded-[10px] px-2 py-1 text-[14px] font-semibold leading-5 text-foreground hover:bg-muted">
            <span className="flex size-[18px] items-center justify-center rounded-[5px] bg-foreground text-background">
              <MagicaMark />
            </span>
            Magica Auto
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem className="flex flex-col items-start gap-0.5">
              <span className="font-semibold">Magica Auto</span>
              <span className="text-[11px] font-semibold text-muted-foreground">OpenRouter Free · no paid fallback</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SignedOut>
        <div className="flex items-center gap-3">
          <Link
            href="https://magica.com/docs/introduction/overview"
            className="inline-flex h-7 items-center rounded-full bg-muted px-3 text-[14px] font-semibold leading-5 text-foreground"
          >
            Magica 101
          </Link>
          <Link href="/sign-in" className="inline-flex h-8 items-center rounded-full px-3 text-[14px] font-semibold leading-5 text-foreground hover:bg-muted">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-8 items-center rounded-full bg-foreground px-3.5 text-[14px] font-semibold leading-5 text-white"
          >
            Sign up
          </Link>
        </div>
      </SignedOut>

      <SignedIn>
        {chatId ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="All files in this task"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setFilesOpen(true)}
            >
              <Folder className="size-4" />
            </button>
            <CreditsPopover balance={me?.creditBalance ?? "0"} />
            <TaskFilesDialog chatId={chatId} open={filesOpen} onOpenChange={setFilesOpen} />
          </div>
        ) : (
          <div />
        )}
      </SignedIn>
    </header>
  );
}
