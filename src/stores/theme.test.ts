import { describe, expect, it } from "vitest";
import { resolvedTheme } from "./theme";

describe("theme", () => {
  it("resolves light and dark choices without the system media query", () => {
    expect(resolvedTheme("light")).toBe("light");
    expect(resolvedTheme("dark")).toBe("dark");
  });
});
