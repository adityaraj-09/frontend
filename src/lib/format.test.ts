import { describe, expect, it } from "vitest";
import { formatCredits, formatDuration, toolLabel } from "./format";

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

describe("toolLabel", () => {
  it("maps Magica and skill tools", () => {
    expect(toolLabel("web_search")).toBe("Web search");
    expect(toolLabel("crop_image")).toBe("Crop Image");
    expect(toolLabel("load_skill")).toBe("Skill");
  });
});
