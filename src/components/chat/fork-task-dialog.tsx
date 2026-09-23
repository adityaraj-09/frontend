"use client";

import { GitFork, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function ForkTaskDialog({
  open,
  onOpenChange,
  onConfirm,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  busy?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-[min(440px,94vw)] max-w-none flex-col gap-0 overflow-hidden rounded-[20px] bg-background p-0 sm:max-w-none"
      >
        <div className="flex items-start justify-between px-6 pt-5">
          <div>
            <DialogTitle className="text-[18px] font-semibold text-foreground">Fork task</DialogTitle>
            <DialogDescription className="mt-1 text-[13px] font-medium leading-5 text-muted-foreground">
              Create a new task branch from this point and continue it in this tab.
            </DialogDescription>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="rounded-[16px] border border-border px-4 py-4">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
              <GitFork className="size-4" strokeWidth={1.75} />
              Fork from this message
            </p>
            <p className="mt-2 text-[13px] font-medium leading-5 text-muted-foreground">
              All messages up to and including this response will be copied into a new task branch.
              Your current task stays the same; after you confirm we&apos;ll take you to the new
              branch here.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 pb-5">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold text-muted-foreground hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-semibold text-background disabled:opacity-40"
            onClick={() => void onConfirm()}
          >
            <GitFork className="size-3.5" strokeWidth={1.75} />
            Fork task
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
