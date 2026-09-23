import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ToolsPage from "./page";

describe("ToolsPage", () => {
  it("shows only supported tools in Magica chrome", async () => {
    render(<ToolsPage />);
    expect(screen.getByRole("heading", { name: "Tools" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deprecated models" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Video" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "GPT Image 2" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Crop Image" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Merge Videos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Web Search" })).toBeInTheDocument();
    expect(screen.queryByText("Gemini Omni Flash")).not.toBeInTheDocument();
    expect(screen.queryByText("Seedance 2.0")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Video" }));
    expect(screen.getByRole("heading", { name: "Merge Videos" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "GPT Image 2" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "All" }));
    await userEvent.type(screen.getByPlaceholderText("Search by name"), "crop");
    expect(screen.getByRole("heading", { name: "Crop Image" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Merge Videos" })).not.toBeInTheDocument();
  });
});
