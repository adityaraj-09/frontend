"use client";

import { useRef } from "react";
import { Image as ImageIcon, Plus } from "lucide-react";
import { useUser } from "@/lib/clerk";

export function AttachMenu({
  onClose,
  onPickFiles,
  onSelectAsset,
}: {
  onClose: () => void;
  onPickFiles: (files: FileList) => void;
  onSelectAsset: () => void;
}) {
  const { isSignedIn } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button type="button" aria-label="Close attachments" className="fixed inset-0 z-20 cursor-default" onClick={onClose} />
      <div className="absolute bottom-[52px] left-3 z-30 flex w-[min(80vw,246px)] flex-col gap-3 rounded-[20px] border border-border bg-muted p-4 text-[14px] leading-5 text-foreground shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
        <p className="text-[12px] font-medium leading-4 text-foreground">
          Add a file from your device or select one from your library
        </p>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,audio/*"
          onChange={(event) => {
            const files = event.target.files;
            if (!files?.length || !isSignedIn) return;
            onPickFiles(files);
            event.target.value = "";
            onClose();
          }}
        />
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-muted px-4 py-2.5 text-[14px] font-semibold leading-5 text-foreground hover:bg-background"
          onClick={onSelectAsset}
        >
          <ImageIcon className="size-4" strokeWidth={1.75} />
          Select Asset
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-transparent bg-foreground px-4 py-2.5 text-[14px] font-semibold leading-5 text-white hover:opacity-90"
          onClick={() => fileRef.current?.click()}
        >
          <Plus className="size-4" strokeWidth={1.75} />
          Upload
        </button>
      </div>
    </>
  );
}
