"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LibraryBrowser } from "./library-browser";
import type { LibraryAttachment } from "@/lib/api/schemas";

export function LibraryDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: LibraryAttachment) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(860px,88vh)] w-[min(1120px,94vw)] max-w-none flex-col gap-0 overflow-hidden rounded-[20px] bg-background p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">Select from library</DialogTitle>
        {open ? (
          <LibraryBrowser
            mode="pick"
            onPick={(item) => {
              onSelect(item);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
