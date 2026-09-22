import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LibraryBrowser } from "./library-browser";
import { LibraryDialog } from "./library-dialog";
import { useLibraryFavorites } from "@/stores/library";

const items = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    origin: "UPLOAD" as const,
    filename: "chart.png",
    mimeType: "image/png",
    url: "https://cdn.example/chart.png",
    thumbnailUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    origin: "GENERATED" as const,
    filename: "ai-crop.png",
    mimeType: "image/png",
    url: "https://cdn.example/ai-crop.png",
    thumbnailUrl: null,
    createdAt: new Date().toISOString(),
  },
];

vi.mock("@/hooks/use-uppy-upload", () => ({
  useUppyUpload: () => ({ addFiles: vi.fn(), retry: vi.fn(), cancel: vi.fn() }),
}));

vi.mock("@/hooks/use-queries", () => ({
  useLibraryQuery: () => ({
    data: { pages: [{ items }] },
    isError: false,
    isSuccess: true,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}));

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("LibraryBrowser", () => {
  afterEach(() => {
    useLibraryFavorites.setState({ ids: [] });
  });

  it("filters tabs and search like Magica", async () => {
    const user = userEvent.setup();
    render(wrap(<LibraryBrowser />));

    expect(screen.getByRole("heading", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search media...")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "chart.png" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "ai-crop.png" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "My Uploads" }));
    expect(screen.getByRole("img", { name: "chart.png" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "ai-crop.png" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Generated" }));
    expect(screen.getByRole("img", { name: "ai-crop.png" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "chart.png" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    await user.type(screen.getByPlaceholderText("Search media..."), "chart");
    expect(screen.getByRole("img", { name: "chart.png" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "ai-crop.png" })).not.toBeInTheDocument();
  });

  it("picks an asset from the same browser in a dialog", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(wrap(<LibraryDialog open onOpenChange={onOpenChange} onSelect={onSelect} />));

    expect(screen.getByRole("heading", { name: "Select from library" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search media...")).toBeInTheDocument();
    await user.click(screen.getByRole("img", { name: "chart.png" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: items[0].id }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
