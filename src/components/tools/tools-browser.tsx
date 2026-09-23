"use client";

import { useMemo, useState } from "react";
import { Archive, Globe, Search, Sparkles, Terminal, Zap } from "lucide-react";
import { filterCatalogTools, SUPPORTED_TOOLS, type ToolCategory } from "@/lib/tools-catalog";
import { cn } from "@/lib/utils";

const TABS: Array<{ id: "all" | ToolCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "video", label: "Video" },
  { id: "image", label: "Image" },
  { id: "audio", label: "Audio" },
  { id: "llms", label: "LLMs" },
  { id: "utils", label: "Utils" },
];

export function ToolsBrowser() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [deprecatedOnly, setDeprecatedOnly] = useState(false);

  const visible = useMemo(
    () => filterCatalogTools(SUPPORTED_TOOLS, query, tab, deprecatedOnly),
    [query, tab, deprecatedOnly],
  );

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-background text-foreground">
      <div className="w-full px-6 pt-5 pb-16">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em]">Tools</h1>
        <p className="mt-1 text-[14px] font-medium text-muted-foreground">
          Explore tools for video, image, audio, LLMs, and more.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <label className="flex h-10 w-[260px] items-center gap-2 rounded-full bg-muted px-3.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name"
              className="h-full w-full bg-transparent text-[14px] font-medium text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
          <button
            type="button"
            aria-pressed={deprecatedOnly}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full bg-muted px-4 text-[13px] font-medium text-muted-foreground",
              deprecatedOnly && "bg-foreground text-background",
            )}
            onClick={() => setDeprecatedOnly((value) => !value)}
          >
            <Archive className="size-3.5" />
            Deprecated models
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6 text-[13px] font-medium text-muted-foreground">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn("py-1", tab === item.id ? "text-foreground" : "hover:text-foreground/70")}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visible.length ? (
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {visible.map((tool) => (
              <article key={tool.id} className="rounded-[22px] bg-muted p-3">
                <div className="flex items-center gap-2 px-2 pb-2.5">
                  <ProviderMark kind={tool.icon} />
                  <h2 className="text-[14px] font-semibold text-foreground">{tool.name}</h2>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-full bg-background px-4 py-2.5">
                  <p className="min-w-0 truncate text-[13px] font-medium text-muted-foreground">
                    {tool.description}
                  </p>
                  <span className="shrink-0 text-[13px] font-medium text-muted-foreground">{tool.cost}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-16 text-center text-[13px] font-medium text-muted-foreground">
            {deprecatedOnly
              ? "No deprecated models among the tools we support."
              : "No tools match that search."}
          </p>
        )}
      </div>
    </div>
  );
}

function ProviderMark({ kind }: { kind: CatalogToolIcon }) {
  const Icon =
    kind === "exa" ? Globe : kind === "e2b" ? Terminal : kind === "skill" ? Zap : Sparkles;
  const tone =
    kind === "exa"
      ? "text-[#2563eb]"
      : kind === "e2b"
        ? "text-muted-foreground"
        : kind === "skill"
          ? "text-[#ca8a04]"
          : "text-[#7c3aed]";
  return <Icon className={cn("size-4 shrink-0", tone)} strokeWidth={2} />;
}

type CatalogToolIcon = "magica" | "e2b" | "exa" | "skill";
