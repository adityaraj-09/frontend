"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Plus } from "lucide-react";
import { useUser } from "@/lib/clerk";
import { useComposerStore } from "@/stores/composer";
import { useLibraryQuery } from "@/hooks/use-queries";

export function AttachMenu({
  onClose,
  onPickFiles,
}: {
  onClose: () => void;
  onPickFiles: (files: FileList) => void;
}) {
  const { isSignedIn } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const addAttachmentIds = useComposerStore((s) => s.addAttachmentIds);
  const library = useLibraryQuery();
  const items = library.data?.pages.flatMap((page) => page.items) ?? [];
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <>
      <button type="button" aria-label="Close attachments" className="fixed inset-0 z-20 cursor-default" onClick={onClose} />
      <div className="absolute bottom-[52px] left-3 z-30 flex w-[min(80vw,246px)] flex-col gap-3 rounded-[20px] border border-[#ededed] bg-[#f1f1f1] p-4 text-[14px] leading-5 text-[#1b1b1b] shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
        <p className="text-[12px] leading-4 text-[#1b1b1b]">
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
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#ededed] bg-[#f7f7f7] px-4 py-2.5 text-[14px] font-medium leading-5 text-[#1b1b1b] hover:bg-white"
          onClick={() => setLibraryOpen((open) => !open)}
        >
          <ImageIcon className="size-4" strokeWidth={1.75} />
          Select Asset
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-transparent bg-[#1b1b1b] px-4 py-2.5 text-[14px] font-medium leading-5 text-white hover:opacity-90"
          onClick={() => fileRef.current?.click()}
        >
          <Plus className="size-4" strokeWidth={1.75} />
          Upload
        </button>
        {libraryOpen ? (
          <div className="grid max-h-40 grid-cols-3 gap-1.5 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="overflow-hidden rounded-md bg-white"
                onClick={() => {
                  addAttachmentIds([item.id]);
                  onClose();
                }}
              >
                {item.thumbnailUrl || item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnailUrl || item.url || ""} alt={item.filename} className="h-16 w-full object-cover" />
                ) : (
                  <span className="block truncate p-1 text-[10px]">{item.filename}</span>
                )}
              </button>
            ))}
            {!items.length ? <p className="col-span-3 py-2 text-[12px] leading-4 text-[#777777]">No files yet.</p> : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
