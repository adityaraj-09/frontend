"use client";

import { useMemo, useState } from "react";
import { MagicaRobot } from "@/components/brand/magica-mark";
import { Composer } from "@/components/composer/composer";
import { IDEA_TABS, IDEAS, type IdeaTab } from "@/lib/ideas";
import { formatClock } from "@/lib/format";
import { useComposerStore } from "@/stores/composer";
import { cn } from "@/lib/utils";

export function HomeHero() {
  const { time, period } = formatClock();
  const setText = useComposerStore((s) => s.setText);
  const [tab, setTab] = useState<IdeaTab>("All");

  const ideas = useMemo(
    () => (tab === "All" ? IDEAS : IDEAS.filter((idea) => idea.tab === tab)),
    [tab],
  );

  return (
    <div className="relative h-full">
    <div className="h-full overflow-y-auto">
      <div className="flex min-h-[calc(100%-248px)] flex-col items-center justify-center px-6 py-6">
        <div className="flex w-full max-w-[900px] flex-col items-center">
          <MagicaRobot size={40} />
          <p
            aria-label="Local time"
            className="mt-[19px] flex items-baseline justify-center gap-1.5 text-[13px] font-semibold leading-[19.5px] tracking-[0.01em] text-muted-foreground"
          >
            <span>{time}</span>
            <span className="-translate-x-[3px] -translate-y-[5px] text-[10px] font-semibold leading-3">{period}</span>
          </p>
          <h1 className="mt-1 text-[24px] font-bold leading-8 text-foreground">Your AI worker</h1>
          <p className="mt-2 text-[14px] font-semibold leading-6 text-muted-foreground">Work at the speed of thought.</p>
          <div className="mt-12 w-full">
            <Composer />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[900px] px-6 pb-10">
        <div className="flex min-h-[34px] items-center gap-1 overflow-x-auto" role="tablist">
          {IDEA_TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className={cn(
                "h-[34px] shrink-0 rounded-[10px] px-2.5 text-[14px] font-semibold leading-5 text-muted-foreground",
                tab === item && "bg-muted text-foreground",
              )}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ideas.map((idea) => (
              <button
                key={idea.title}
                type="button"
                aria-label={idea.title}
                className="group relative h-[300px] overflow-hidden rounded-[16px] border border-border bg-muted text-left"
                onClick={() => setText(idea.prompt)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={idea.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
