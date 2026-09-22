"use client";

import { X } from "lucide-react";
import { useUiStore } from "@/stores/ui";

export function ArtifactPanel({
  artifact,
}: {
  artifact: { title: string; url: string; mimeType: string };
}) {
  const setArtifact = useUiStore((s) => s.setArtifact);
  const isImage = artifact.mimeType.startsWith("image/");
  const isVideo = artifact.mimeType.startsWith("video/");

  return (
    <aside className="hidden h-full w-[46%] shrink-0 flex-col border-l border-[#ededed] bg-[#111] text-white md:flex">
      <div className="flex h-10 items-center justify-between border-b border-white/10 px-3 text-[12px] font-semibold">
        <span className="truncate">{artifact.title}</span>
        <button
          type="button"
          aria-label="Close preview"
          className="flex size-7 items-center justify-center rounded-md hover:bg-white/10"
          onClick={() => setArtifact(null)}
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artifact.url} alt={artifact.title} className="max-h-full max-w-full object-contain" />
        ) : isVideo ? (
          <video src={artifact.url} controls className="max-h-full max-w-full" />
        ) : (
          <a href={artifact.url} className="text-[13px] underline" target="_blank" rel="noreferrer">
            Open {artifact.title}
          </a>
        )}
      </div>
    </aside>
  );
}
