export function formatTurnUsage(usage: {
  promptTokens?: number;
  completionTokens?: number;
  credits?: string;
  model?: string | null;
  durationMs?: number | null;
}): string {
  const parts: string[] = [];
  const duration = formatDuration(usage.durationMs);
  if (duration) parts.push(duration);
  const tokens = (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0);
  if (tokens > 0) parts.push(`${tokens} tokens`);
  const credits = formatCredits(usage.credits ?? "0");
  parts.push(`${credits} ${credits === "1" ? "credit" : "credits"}`);
  const model = shortModel(usage.model);
  if (model) parts.push(model);
  return parts.join(" · ");
}

function shortModel(model?: string | null): string {
  if (!model) return "";
  return (model.split("/").pop() ?? model).replace(/:free$/, "");
}

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

export function formatBytes(bytes?: number | null): string {
  if (bytes == null || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

export function fileKindLabel(mimeType: string, filename?: string): string {
  const ext = filename?.includes(".") ? filename.split(".").pop()?.toUpperCase() : undefined;
  if (mimeType.startsWith("image/")) return ext && ext.length <= 5 ? ext : "IMAGE";
  if (mimeType.startsWith("video/")) return ext && ext.length <= 5 ? ext : "VIDEO";
  if (mimeType.startsWith("audio/")) return ext && ext.length <= 5 ? ext : "AUDIO";
  if (isCodeFile(mimeType, filename)) return ext && ext.length <= 5 ? ext : "CODE";
  return ext && ext.length <= 5 ? ext : "DOCUMENT";
}

export function fileKindTab(
  mimeType: string,
  filename?: string,
): "documents" | "images" | "videos" | "audio" | "code" {
  if (mimeType.startsWith("image/")) return "images";
  if (mimeType.startsWith("video/")) return "videos";
  if (mimeType.startsWith("audio/")) return "audio";
  if (isCodeFile(mimeType, filename)) return "code";
  return "documents";
}

export function dayGroupLabel(iso?: string, now = new Date()): string {
  if (!iso) return "Earlier";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Earlier";
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const today = start(now);
  const then = start(date);
  if (then === today) return "Today";
  if (then === today - 86_400_000) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function isCodeFile(mimeType: string, filename?: string): boolean {
  if (mimeType.startsWith("text/") || /javascript|json|typescript|python|xml/.test(mimeType)) {
    return true;
  }
  return Boolean(filename && /\.(js|ts|tsx|jsx|py|json|html|css|md|sh)$/i.test(filename));
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
      return "Crop image";
    case "gpt_image_2":
      return "Generate image";
    case "merge_videos":
      return "Merge videos";
    default:
      return name.replaceAll("_", " ");
  }
}

/** User-facing label for a live run while the model has not streamed text yet. */
export function liveStepLabel(
  currentStep: string | null | undefined,
  status?: string | null,
): string {
  const step = currentStep?.trim() ?? "";
  if (step === "thinking" || step.startsWith("llm:")) return "Thinking…";
  if (step.startsWith("tools:")) return "Working…";
  if (step === "wait:plan") return "Waiting for plan approval…";
  if (step === "wait:credit") return "Waiting for credit approval…";
  if (step === "wait:media") return "Waiting for media approval…";
  if (step === "wait:options") return "Waiting for a choice…";
  if (step === "queued") return "Starting…";
  if (step === "stopping" || step === "cancelled") return "Stopping…";
  if (status === "THINKING" || status === "QUEUED") return "Thinking…";
  if (status === "WAITING") return "Waiting…";
  if (status === "STOPPING") return "Stopping…";
  return "Working…";
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

/** A finished database snapshot wins over Trigger metadata that is still reporting the run as active. */
export function preferRunStatus(
  live: string | null | undefined,
  rest: string | null | undefined,
): string | null | undefined {
  if (rest && !isActiveRun(rest) && (!live || isActiveRun(live))) return rest;
  return live ?? rest ?? null;
}
