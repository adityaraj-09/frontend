import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import ProjectsPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/clerk", () => ({
  SignedIn: ({ children }: { children: ReactElement }) => children,
  SignedOut: () => null,
}));

vi.mock("@/hooks/use-queries", () => ({
  useProjectsQuery: () => ({
    data: {
      items: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          name: "Writing",
          icon: "writing",
          taskCount: 0,
          createdAt: "2026-09-23T05:00:00.000Z",
          updatedAt: "2026-09-23T05:00:00.000Z",
        },
      ],
    },
  }),
  useChatsQuery: () => ({ data: { pages: [{ items: [] }] } }),
}));

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("ProjectsPage", () => {
  it("lists owned projects", () => {
    render(wrap(<ProjectsPage />));
    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Writing" })).toBeInTheDocument();
    expect(screen.getByText(/0 tasks/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search projects...")).toBeInTheDocument();
  });
});
