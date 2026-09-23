"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const UPDATES = [
  {
    title: "Task files",
    body: "Open the folder on a chat to see uploads and generated files for that task only.",
  },
  {
    title: "Tools catalog",
    body: "Browse the models and utilities we actually support, with cost shown on each card.",
  },
  {
    title: "Projects",
    body: "Group tasks, keep memory and instructions, and start a new chat from a project.",
  },
];

export function UpdatesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(440px,92vw)] max-w-none gap-0 overflow-hidden rounded-[28px] bg-background p-0 text-foreground sm:max-w-none"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <DialogTitle className="text-[16px] font-semibold tracking-[-0.02em]">Updates</DialogTitle>
          <button
            type="button"
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-full hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="space-y-4 px-5 pb-6">
          {UPDATES.map((item) => (
            <li key={item.title}>
              <p className="text-[14px] font-semibold">{item.title}</p>
              <p className="mt-1 text-[13px] font-medium leading-5 text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
