import { describe, expect, it } from "vitest";
import { projectIdFromLocation, resolveProjectId } from "./project-route";

const id = "4993369f-c375-4ee7-90d8-5ea27aa09d6b";

describe("projectIdFromLocation", () => {
  it("reads the project workspace path", () => {
    expect(projectIdFromLocation(`/projects/${id}`, "")).toBe(id);
  });

  it("reads a query param", () => {
    expect(projectIdFromLocation("/", `?projectId=${id}`)).toBe(id);
  });

  it("ignores non-uuid segments", () => {
    expect(projectIdFromLocation("/projects/writing", "")).toBeUndefined();
  });
});

describe("resolveProjectId", () => {
  it("prefers an explicit id", () => {
    expect(resolveProjectId(id)).toBe(id);
  });
});
