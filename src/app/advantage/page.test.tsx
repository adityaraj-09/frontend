import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdvantagePage from "./page";

describe("AdvantagePage", () => {
  it("shows Magica Unfair Advantage resource cards", () => {
    render(<AdvantagePage />);
    expect(screen.getByRole("heading", { name: "Unfair Advantage" })).toBeInTheDocument();
    expect(screen.getByText(/Move from inspiration to execution/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Prompt Library" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tutorials" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ad Library" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse prompts" })).toHaveAttribute(
      "href",
      "https://magica.com/prompts",
    );
    expect(screen.getByRole("link", { name: "Watch tutorials" })).toHaveAttribute(
      "href",
      "https://magica.com/learn",
    );
    expect(screen.getByRole("link", { name: "Explore ads" })).toHaveAttribute(
      "href",
      "https://magica.com/ad-library",
    );
  });
});
