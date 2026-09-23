import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { TopBar } from "./top-bar";

const path = { current: "/library" };

vi.mock("next/navigation", () => ({
  usePathname: () => path.current,
}));

vi.mock("@/lib/clerk", () => ({
  SignedIn: ({ children }: { children: ReactElement }) => children,
  SignedOut: () => null,
}));

vi.mock("@/hooks/use-queries", () => ({
  useMeQuery: () => ({ data: { creditBalance: "79.71" } }),
  useChatFilesQuery: () => ({
    data: { pages: [{ items: [] }] },
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    isLoading: false,
  }),
}));

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("TopBar", () => {
  it("hides folder and credits off a task page", () => {
    path.current = "/library";
    render(wrap(<TopBar />));
    expect(screen.queryByRole("button", { name: "All files in this task" })).not.toBeInTheDocument();
    expect(screen.queryByText("79.71")).not.toBeInTheDocument();
  });

  it("shows folder and credits on a task chat", () => {
    path.current = "/chat/332f7edf-6265-4fe4-98e7-1ef990920469";
    render(wrap(<TopBar />));
    expect(screen.getByRole("button", { name: "All files in this task" })).toBeInTheDocument();
    expect(screen.getByText("79.71")).toBeInTheDocument();
  });
});
