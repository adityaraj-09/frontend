import { test, expect } from "@playwright/test";

test("home matches Magica empty state copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your AI worker" })).toBeVisible();
  await expect(page.getByText("Work at the speed of thought.")).toBeVisible();
  await expect(page.getByPlaceholder("Assign a task or ask anything...")).toBeVisible();
  await expect(page.getByRole("tab", { name: "All" })).toBeVisible();
});
