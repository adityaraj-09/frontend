"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Ellipsis, FileText, Lock, Plus, Settings } from "lucide-react";
import { useProjectQuery } from "@/hooks/use-queries";
import { projectApi } from "@/lib/api/services";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { projectPreset } from "@/lib/project-presets";
import { Composer } from "@/components/composer/composer";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.projectId;
  const project = useProjectQuery(projectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [instructions, setInstructions] = useState<string | null>(null);
  const row = project.data;
  const preset = projectPreset(row?.icon);
  const text = instructions ?? row?.instructions ?? "";

  async function saveInstructions() {
    if (!row) return;
    await projectApi.update(row.id, { instructions: text });
    await queryClient.invalidateQueries({ queryKey: queryKeys.project(row.id) });
  }

  async function toggleMemory() {
    if (!row) return;
    await projectApi.update(row.id, { memoryEnabled: !row.memoryEnabled });
    await queryClient.invalidateQueries({ queryKey: queryKeys.project(row.id) });
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-white">
      <div className="flex w-full flex-col px-6 pt-5 pb-12">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#404040] hover:text-[#1b1b1b]"
          >
            <ArrowLeft className="size-3.5" />
            All projects
          </Link>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#ededed] bg-white px-3 text-[13px] font-semibold"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3.5" />
            New Project
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-[28px] font-semibold tracking-[-0.03em]">
            <preset.Icon className={cn("size-5", preset.tone)} />
            {row?.name ?? "Project"}
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Project menu" className="flex size-8 items-center justify-center rounded-full hover:bg-[#f7f7f7]">
              <Ellipsis className="size-4 text-[#404040]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (!row) return;
                  void projectApi.remove(row.id).then(() => {
                    void queryClient.invalidateQueries({ queryKey: ["projects"] });
                    router.push("/projects");
                  });
                }}
              >
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <Composer />
            <p className="mt-4 rounded-[16px] bg-[#f7f7f7] px-4 py-6 text-center text-[13px] font-medium text-[#8a8a8a]">
              Start a chat to keep conversations organized and re-use project knowledge.
            </p>
          </div>
          <aside className="flex flex-col gap-3">
            <RailCard
              title="Memory"
              action={
                <button type="button" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#404040]" onClick={() => void toggleMemory()}>
                  <Lock className="size-3" />
                  {row?.memoryEnabled === false ? "Off" : "Only you"}
                </button>
              }
            >
              0% of memory used
            </RailCard>
            <RailCard
              title="Instructions"
              action={<Settings className="size-3.5 text-[#8a8a8a]" />}
            >
              <textarea
                value={text}
                onChange={(event) => setInstructions(event.target.value)}
                onBlur={() => void saveInstructions()}
                placeholder="Add instructions to tailor responses for this project"
                className="mt-2 min-h-20 w-full resize-none bg-transparent text-[13px] font-medium outline-none placeholder:text-[#8a8a8a]"
              />
            </RailCard>
            <RailCard title="Files" action={<Plus className="size-3.5 text-[#8a8a8a]" />}>
              <span className="inline-flex items-center gap-1">
                <FileText className="size-3.5" />
                0% of project capacity used
              </span>
            </RailCard>
          </aside>
        </div>
      </div>
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async (input) => {
          const created = await projectApi.create(input);
          await queryClient.invalidateQueries({ queryKey: ["projects"] });
          setCreateOpen(false);
          router.push(`/projects/${created.id}`);
        }}
      />
    </div>
  );
}

function RailCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-[#ededed] px-4 py-3">
      <div className="flex items-center justify-between text-[13px] font-semibold">
        {title}
        {action}
      </div>
      <div className="mt-1 text-[12px] font-medium text-[#8a8a8a]">{children}</div>
    </section>
  );
}
