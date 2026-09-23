import { describe, expect, it } from "vitest";
import {
  dayGroupLabel,
  fileKindLabel,
  fileKindTab,
  formatBytes,
  formatCredits,
  formatDuration,
  formatTurnUsage,
  liveStepLabel,
  preferRunStatus,
  toolLabel,
} from "./format";

describe("formatCredits", () => {
  it("uses Magica-style compact units", () => {
    expect(formatCredits("27.61")).toBe("27.61");
    expect(formatCredits(27_610_000)).toBe("27.61M");
    expect(formatCredits(1500)).toBe("1.5K");
  });
});

describe("formatTurnUsage", () => {
  it("shows duration, tokens, credits, and the routed model", () => {
    expect(
      formatTurnUsage({
        promptTokens: 12,
        completionTokens: 8,
        credits: "0",
        model: "deepseek/deepseek-r1:free",
        durationMs: 2400,
      }),
    ).toBe("2.4s · 20 tokens · 0 credits · deepseek-r1");
  });
});

describe("task file labels", () => {
  it("shows Magica kind, size, and day groups", () => {
    expect(fileKindLabel("image/png", "console.png")).toBe("PNG");
    expect(fileKindLabel("image/jpeg", "image file")).toBe("IMAGE");
    expect(fileKindTab("image/png", "console.png")).toBe("images");
    expect(formatBytes(174_080)).toBe("170 KB");
    expect(dayGroupLabel("2026-09-22T10:00:00.000Z", new Date("2026-09-23T10:00:00.000Z"))).toBe(
      "Yesterday",
    );
  });
});

describe("formatDuration", () => {
  it("renders ms and seconds", () => {
    expect(formatDuration(14)).toBe("14ms");
    expect(formatDuration(9700)).toBe("9.7s");
  });
});

describe("preferRunStatus", () => {
  it("lets a finished database snapshot replace stale live metadata", () => {
    expect(preferRunStatus("WORKING", "COMPLETE")).toBe("COMPLETE");
    expect(preferRunStatus("WORKING", "QUEUED")).toBe("WORKING");
    expect(preferRunStatus(undefined, null)).toBeNull();
  });
});

describe("toolLabel", () => {
  it("maps Magica and skill tools", () => {
    expect(toolLabel("web_search")).toBe("Web search");
    expect(toolLabel("crop_image")).toBe("Crop image");
    expect(toolLabel("gpt_image_2")).toBe("Generate image");
    expect(toolLabel("load_skill")).toBe("Skill");
  });
});

describe("liveStepLabel", () => {
  it("never surfaces internal loop ids like llm:1", () => {
    expect(liveStepLabel("llm:1", "THINKING")).toBe("Thinking…");
    expect(liveStepLabel("thinking", "THINKING")).toBe("Thinking…");
    expect(liveStepLabel("tools:2", "WORKING")).toBe("Working…");
    expect(liveStepLabel("wait:plan", "WAITING")).toBe("Waiting for plan approval…");
    expect(liveStepLabel(null, "THINKING")).toBe("Thinking…");
    expect(liveStepLabel(undefined, "WORKING")).toBe("Working…");
  });
});
