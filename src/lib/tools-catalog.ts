export type ToolCategory = "video" | "image" | "audio" | "llms" | "utils";

export type CatalogTool = {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  provider: string;
  icon: "magica" | "e2b" | "exa" | "skill";
  cost: string;
  deprecated?: boolean;
};

/** Tools the agent can actually call. Not the full Magica marketplace. */
export const SUPPORTED_TOOLS: CatalogTool[] = [
  {
    id: "gpt_image_2",
    name: "GPT Image 2",
    description: "Generate a new image from a prompt, or edit an existing image.",
    category: "image",
    provider: "Magica",
    icon: "magica",
    cost: "~0M",
  },
  {
    id: "crop_image",
    name: "Crop Image",
    description: "Crop an image by pixel or percent rectangle and return a generated URL.",
    category: "image",
    provider: "Magica",
    icon: "magica",
    cost: "~0M",
  },
  {
    id: "merge_videos",
    name: "Merge Videos",
    description: "Merge 2–100 videos in order with none, fade, or dissolve transitions.",
    category: "video",
    provider: "Magica",
    icon: "magica",
    cost: "~0M",
  },
  {
    id: "web_search",
    name: "Web Search",
    description: "Search the live web and return titled results with URLs and snippets.",
    category: "utils",
    provider: "Exa",
    icon: "exa",
    cost: "~0M",
  },
  {
    id: "sandbox_run_code",
    name: "Sandbox Execute",
    description: "Run Python or bash for computation that is not image or video editing.",
    category: "utils",
    provider: "E2B",
    icon: "e2b",
    cost: "~0M",
  },
  {
    id: "load_skill",
    name: "Load Skill",
    description: "Load the full SKILL.md body for a named application skill.",
    category: "utils",
    provider: "Skills",
    icon: "skill",
    cost: "~0M",
  },
  {
    id: "read_skill_asset",
    name: "Read Skill Asset",
    description: "Read a file from an approved skill directory. Path traversal is rejected.",
    category: "utils",
    provider: "Skills",
    icon: "skill",
    cost: "~0M",
  },
];

export function filterCatalogTools(
  tools: CatalogTool[],
  query: string,
  category: "all" | ToolCategory,
  deprecatedOnly: boolean,
): CatalogTool[] {
  const q = query.trim().toLowerCase();
  return tools.filter((tool) => {
    if (deprecatedOnly ? !tool.deprecated : tool.deprecated) return false;
    if (category !== "all" && tool.category !== category) return false;
    if (
      q &&
      !tool.name.toLowerCase().includes(q) &&
      !tool.id.toLowerCase().includes(q) &&
      !tool.provider.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
}
