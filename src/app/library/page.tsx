"use client";

import { useLibraryQuery } from "@/hooks/use-queries";

export default function LibraryPage() {
  const library = useLibraryQuery();
  const items = library.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <h1 className="text-[22px] font-semibold">Library</h1>
      <p className="mt-1 text-[13px] text-[#737373]">Uploads and generated files you can attach to a task.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-2xl border border-[#ededed]">
            {item.thumbnailUrl || (item.url && item.mimeType.startsWith("image/")) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.thumbnailUrl || item.url || ""} alt={item.filename} className="h-36 w-full object-cover" />
            ) : (
              <div className="flex h-36 items-center justify-center bg-[#fafafa] p-2 text-center text-[12px] text-[#737373]">
                {item.filename}
              </div>
            )}
            <div className="truncate px-2 py-2 text-[12px]">{item.filename}</div>
          </div>
        ))}
      </div>
      {!items.length ? <p className="mt-8 text-[13px] text-[#a1a1aa]">Nothing in the library yet.</p> : null}
    </div>
  );
}
