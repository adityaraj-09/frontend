"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Ellipsis, Plus, Search } from "lucide-react";
import { SignedIn, SignedOut } from "@/lib/clerk";
import { useProjectsQuery } from "@/hooks/use-queries";
import { projectApi } from "@/lib/api/services";
import { useQueryClient } from "@tanstack/react-query";
import { formatAgo } from "@/lib/format";
import { projectPreset, type ProjectIconId } from "@/lib/project-presets";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateProjectDialog } from "./create-project-dialog";

type Sort = "activity" | "name";

export function ProjectsBrowser() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("activity");
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const projects = useProjectsQuery(query);
  const items = useMemo(() => {
    const rows = [...(projects.data?.items ?? [])];
    return rows.sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [projects.data?.items, sort]);

  async function create(input: { name: string; icon: ProjectIconId; memoryEnabled: boolean }) {
    setBusy(true);
    try {
      const created = await projectApi.create(input);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setCreateOpen(false);
      router.push(`/projects/${created.id}`);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await projectApi.remove(id);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-background text-foreground">
      <div className="w-full px-6 pt-5 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[30px] font-bold leading-9">Projects</h1>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-muted-foreground hover:bg-muted">
                Sort by {sort === "name" ? "Name" : "Activity"}
                <ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSort("activity")}>Activity</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSort("name")}>Name</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3 text-[13px] font-semibold text-background"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-3.5" />
              New project
            </button>
          </div>
        </div>

        <label className="mt-5 flex h-11 items-center gap-2 rounded-full bg-muted px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects..."
            className="h-full w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-muted-foreground"
          />
        </label>

        <SignedOut>
          <p className="mt-8 text-[14px] font-medium text-muted-foreground">Sign in to create and open projects.</p>
        </SignedOut>

        <SignedIn>
          {items.length ? (
            <div className="mt-5 flex flex-col gap-3">
              {items.map((project) => {
                const preset = projectPreset(project.icon);
                return (
                  <article key={project.id} className="rounded-[20px] border border-border bg-background px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/projects/${project.id}`} className="min-w-0">
                        <div className="flex items-center gap-2">
                          <preset.Icon className={cn("size-4", preset.tone)} />
                          <h2 className="truncate text-[15px] font-semibold">{project.name}</h2>
                        </div>
                        <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                          Updated {formatAgo(project.updatedAt)} / {project.taskCount}{" "}
                          {project.taskCount === 1 ? "task" : "tasks"}
                        </p>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`${project.name} menu`}
                          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                        >
                          <Ellipsis className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={busy} onClick={() => void remove(project.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-16 text-center text-[13px] font-medium text-muted-foreground">
              {query ? "No projects match that search." : "No projects yet. Create one to group tasks."}
            </p>
          )}
        </SignedIn>
      </div>
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={create}
        busy={busy}
      />
    </div>
  );
}
