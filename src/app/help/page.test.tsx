import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HelpPage from "./page";

describe("HelpPage", () => {
  it("explains recovery, credits, and one-run-per-chat", () => {
    render(<HelpPage />);
    expect(screen.getByRole("heading", { name: "Help & Support" })).toBeInTheDocument();
    expect(screen.getByText("One run at a time")).toBeInTheDocument();
    expect(screen.getByText(/credit waitpoint/i)).toBeInTheDocument();
  });
});
