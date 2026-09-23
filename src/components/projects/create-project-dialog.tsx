"use client";

import { useState } from "react";
import { Folder, Settings, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PROJECT_PRESETS, type ProjectIconId } from "@/lib/project-presets";
import { cn } from "@/lib/utils";

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreate,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { name: string; icon: ProjectIconId; memoryEnabled: boolean }) => Promise<void>;
  busy?: boolean;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<ProjectIconId>("writing");
  const [memoryEnabled, setMemoryEnabled] = useState(true);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onCreate({ name: trimmed, icon, memoryEnabled });
    setName("");
    setIcon("writing");
    setMemoryEnabled(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-[min(560px,94vw)] max-w-none flex-col gap-0 overflow-hidden rounded-[24px] bg-white p-0 sm:max-w-none"
      >
        <div className="flex items-start justify-between px-7 pt-6">
          <div>
            <DialogTitle className="text-[22px] font-semibold text-[#1b1b1b]">Create New Project</DialogTitle>
            <DialogDescription className="mt-1 text-[13px] font-medium text-[#8a8a8a]">
              Set up your project workspace
            </DialogDescription>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full text-[#8a8a8a] hover:bg-[#f7f7f7]"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-7 pt-6 pb-4">
          <h3 className="text-[14px] font-semibold text-[#1b1b1b]">Project Name & Icon</h3>
          <label className="mt-3 flex h-12 items-center gap-3 rounded-full bg-[#f7f7f7] px-4">
            <Folder className="size-4 text-[#8a8a8a]" />
            <input
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name your project"
              className="h-full w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-[#8a8a8a]"
            />
          </label>
          <div className="mt-2 flex items-center justify-between text-[12px] font-medium text-[#8a8a8a]">
            <span>Choose a name and icon for your project</span>
            <span>{name.length}/100</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PROJECT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setIcon(preset.id);
                  if (!name.trim()) setName(preset.label);
                }}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full bg-[#f7f7f7] px-3 text-[13px] font-medium text-[#1b1b1b]",
                  icon === preset.id && "ring-1 ring-[#1b1b1b]",
                )}
              >
                <preset.Icon className={cn("size-3.5", preset.tone)} />
                {preset.label}
              </button>
            ))}
          </div>

          <h3 className="mt-8 text-[14px] font-semibold text-[#1b1b1b]">Memory Settings</h3>
          <div className="mt-3 rounded-[16px] bg-[#f7f7f7] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold text-[#1b1b1b]">
                  Enable AI Memory <span className="font-medium text-[#8a8a8a]">recommended</span>
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-[#8a8a8a]">
                  AI can remember context from conversations
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={memoryEnabled}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  memoryEnabled ? "bg-[#1b1b1b]" : "bg-[#d4d4d4]",
                )}
                onClick={() => setMemoryEnabled((value) => !value)}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
                    memoryEnabled && "translate-x-5",
                  )}
                />
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-[16px] bg-[#f7f7f7] px-4 py-3 text-[14px] font-semibold text-[#1b1b1b]">
            Shared
            <Settings className="size-4 text-[#8a8a8a]" />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-7 py-5">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold text-[#404040] hover:bg-[#f7f7f7]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !name.trim()}
            className="inline-flex h-9 items-center rounded-full bg-[#1b1b1b] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
            onClick={() => void submit()}
          >
            Create Project
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
