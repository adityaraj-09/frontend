import { describe, expect, it } from "vitest";
import { filterCatalogTools, SUPPORTED_TOOLS } from "./tools-catalog";

describe("tools catalog", () => {
  it("lists only supported tools", () => {
    expect(SUPPORTED_TOOLS.map((tool) => tool.id)).toEqual([
      "gpt_image_2",
      "crop_image",
      "merge_videos",
      "web_search",
      "sandbox_run_code",
      "load_skill",
      "read_skill_asset",
    ]);
  });

  it("filters by category and search", () => {
    expect(filterCatalogTools(SUPPORTED_TOOLS, "", "image", false).map((tool) => tool.id)).toEqual([
      "gpt_image_2",
      "crop_image",
    ]);
    expect(filterCatalogTools(SUPPORTED_TOOLS, "merge", "all", false)).toHaveLength(1);
    expect(filterCatalogTools(SUPPORTED_TOOLS, "", "audio", false)).toEqual([]);
    expect(filterCatalogTools(SUPPORTED_TOOLS, "", "all", true)).toEqual([]);
  });
});
