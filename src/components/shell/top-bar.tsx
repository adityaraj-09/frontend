"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@/lib/clerk";
import { ChevronDown, Folder, PanelLeft } from "lucide-react";
import { MagicaMark } from "@/components/brand/magica-mark";
import { useMeQuery } from "@/hooks/use-queries";
import { useUiStore } from "@/stores/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditsPopover } from "./credits-popover";

export function TopBar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const { data: me } = useMeQuery();

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {!sidebarOpen ? (
          <button
            type="button"
            aria-label="Open sidebar"
            className="mr-1 flex size-7 items-center justify-center rounded-md text-[#404040] hover:bg-black/5"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeft className="size-3.5" />
          </button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-7 max-w-[180px] items-center gap-2 rounded-[10px] px-2 py-1 text-[14px] font-semibold leading-5 text-[#181818] hover:bg-[#f1f1f1]">
            <span className="flex size-[18px] items-center justify-center rounded-[5px] bg-black text-white">
              <MagicaMark />
            </span>
            Magica Auto
            <ChevronDown className="size-3.5 text-[#404040]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem className="flex flex-col items-start gap-0.5">
              <span className="font-semibold">Magica Auto</span>
              <span className="text-[11px] font-semibold text-[#404040]">OpenRouter Free · no paid fallback</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SignedOut>
        <div className="flex items-center gap-3">
          <Link
            href="https://magica.com/docs/introduction/overview"
            className="inline-flex h-7 items-center rounded-full bg-[#f1f1f1] px-3 text-[14px] font-semibold leading-5 text-[#1b1b1b]"
          >
            Magica 101
          </Link>
          <Link href="/sign-in" className="inline-flex h-8 items-center rounded-full px-3 text-[14px] font-semibold leading-5 text-[#1b1b1b] hover:bg-[#f1f1f1]">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-8 items-center rounded-full bg-[#1b1b1b] px-3.5 text-[14px] font-semibold leading-5 text-white"
          >
            Sign up
          </Link>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Projects"
            className="flex size-8 items-center justify-center rounded-full text-[#404040] hover:bg-black/5"
          >
            <Folder className="size-4" />
          </button>
          <CreditsPopover balance={me?.creditBalance ?? "0"} />
        </div>
      </SignedIn>
    </header>
  );
}
