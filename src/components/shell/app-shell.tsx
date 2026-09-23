"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ArtifactPanel } from "@/components/chat/artifact-panel";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const artifact = useUiStore((s) => s.artifact);
  const [mobile, setMobile] = useState(false);
  const isAuth = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  if (isAuth) return children;

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {mobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[240px] p-0 [&>button]:hidden">
            <Sidebar />
          </SheetContent>
        </Sheet>
      ) : sidebarOpen ? (
        <Sidebar />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <main className="relative min-w-0 flex-1 overflow-hidden">{children}</main>
          {artifact ? <ArtifactPanel artifact={artifact} /> : null}
        </div>
      </div>
      <SettingsDialog />
    </div>
  );
}
