import { Asterisk, GraduationCap, Landmark, PenLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const PROJECT_PRESETS = [
  { id: "investing", label: "Investing", Icon: Landmark, tone: "text-[#16a34a]" },
  { id: "homework", label: "Homework", Icon: GraduationCap, tone: "text-[#2563eb]" },
  { id: "writing", label: "Writing", Icon: PenLine, tone: "text-[#7c3aed]" },
  { id: "health", label: "Health", Icon: Asterisk, tone: "text-[#e11d48]" },
] as const;

export type ProjectIconId = (typeof PROJECT_PRESETS)[number]["id"];

export function projectPreset(icon?: string): { id: string; label: string; Icon: LucideIcon; tone: string } {
  return PROJECT_PRESETS.find((item) => item.id === icon) ?? PROJECT_PRESETS[2];
}
