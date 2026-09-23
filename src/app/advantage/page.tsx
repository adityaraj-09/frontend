import { ArrowUpRight, BookText, GraduationCap, Megaphone, type LucideIcon } from "lucide-react";

const RESOURCES = [
  {
    eyebrow: "Create",
    title: "Prompt Library",
    description:
      "Start with expert-crafted prompts for image, video, and text models—then make each one your own.",
    href: "https://magica.com/prompts",
    action: "Browse prompts",
    Icon: BookText,
  },
  {
    eyebrow: "Learn",
    title: "Tutorials",
    description:
      "Follow practical walkthroughs that turn powerful AI tools into repeatable creative workflows.",
    href: "https://magica.com/learn",
    action: "Watch tutorials",
    Icon: GraduationCap,
  },
  {
    eyebrow: "Study",
    title: "Ad Library",
    description:
      "See proven creative patterns from real campaigns and turn market signals into stronger concepts.",
    href: "https://magica.com/ad-library",
    action: "Explore ads",
    Icon: Megaphone,
  },
] as const satisfies ReadonlyArray<{
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  Icon: LucideIcon;
}>;

export default function AdvantagePage() {
  return (
    <div className="h-full overflow-y-auto bg-background text-foreground">
      <div className="w-full px-6 pb-16 pt-5">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em]">Unfair Advantage</h1>
        <p className="mt-2 max-w-[640px] text-[14px] font-medium leading-6 text-muted-foreground">
          Move from inspiration to execution with the resources built to help you create faster, learn
          deeply, and recognize what works.
        </p>

        <div className="mt-10 rounded-[28px] border border-border p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {RESOURCES.map((item) => (
              <article
                key={item.title}
                className="flex min-h-[280px] flex-col rounded-[22px] border border-border bg-background px-6 py-7"
              >
                <item.Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
                <p className="mt-6 text-[13px] font-medium text-muted-foreground">{item.eyebrow}</p>
                <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.02em]">{item.title}</h2>
                <p className="mt-2 text-[13px] font-medium leading-5 text-muted-foreground">
                  {item.description}
                </p>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto inline-flex h-8 w-fit items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] font-semibold text-foreground hover:bg-muted"
                >
                  {item.action}
                  <ArrowUpRight className="size-3.5" strokeWidth={2} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
