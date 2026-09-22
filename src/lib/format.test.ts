import { describe, expect, it } from "vitest";
import { formatCredits, formatDuration, liveStepLabel, preferRunStatus, toolLabel } from "./format";

describe("formatCredits", () => {
  it("uses Magica-style compact units", () => {
    expect(formatCredits("27.61")).toBe("27.61");
    expect(formatCredits(27_610_000)).toBe("27.61M");
    expect(formatCredits(1500)).toBe("1.5K");
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
