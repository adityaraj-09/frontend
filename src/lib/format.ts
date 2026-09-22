export function formatCredits(raw: string | number): string {
  const value = typeof raw === "string" ? Number(raw) : raw;
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2).replace(/\.?0+$/, "")}K`;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "";
  if (ms < 1000) return `${Math.max(1, Math.round(ms))}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}m ${rest}s`;
}

export function formatAgo(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const delta = Math.max(0, now - then);
  const minutes = Math.floor(delta / 60_000);
  const hours = Math.floor(delta / 3_600_000);
  const days = Math.floor(delta / 86_400_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatClock(now = new Date()): { time: string; period: string } {
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "pm" : "am";
  const twelve = hours % 12 || 12;
  return { time: `${twelve}:${minutes}`, period };
}

export function toolLabel(name: string): string {
  switch (name) {
    case "web_search":
      return "Web search";
    case "load_skill":
    case "read_skill_asset":
      return "Skill";
    case "sandbox_run_code":
      return "Sandbox Execute";
    case "crop_image":
      return "Crop Image";
    case "gpt_image_2":
      return "GPT Image 2";
    case "merge_videos":
      return "Merge Videos";
    default:
      return name.replaceAll("_", " ");
  }
}

export function isActiveRun(status: string | null | undefined): boolean {
  return (
    status === "QUEUED" ||
    status === "THINKING" ||
    status === "WORKING" ||
    status === "WAITING" ||
    status === "STOPPING"
  );
}
