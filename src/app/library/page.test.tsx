import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import LibraryPage from "./page";

vi.mock("@/hooks/use-uppy-upload", () => ({
  useUppyUpload: () => ({ addFiles: vi.fn(), retry: vi.fn(), cancel: vi.fn() }),
}));

vi.mock("@/hooks/use-queries", () => ({
  useLibraryQuery: () => ({
    data: {
      pages: [
        {
          items: [
            {
              id: "11111111-1111-1111-1111-111111111111",
              origin: "UPLOAD",
              filename: "chart.png",
              mimeType: "image/png",
              url: "https://cdn.example/chart.png",
              thumbnailUrl: null,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ],
    },
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

describe("LibraryPage", () => {
  it("renders the Magica library chrome and uploaded images", () => {
    render(wrap(<LibraryPage />));
    expect(screen.getByRole("heading", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search media...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload media" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "My Uploads" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "chart.png" })).toHaveAttribute(
      "src",
      "https://cdn.example/chart.png",
    );
    expect(screen.getByText("1 file")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });
});
