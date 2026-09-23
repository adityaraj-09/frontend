import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import ProjectDetailPage from "./page";

const projectId = "4993369f-c375-4ee7-90d8-5ea27aa09d6b";
const chatId = "332f7edf-6265-4fe4-98e7-1ef990920469";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ projectId }),
}));

vi.mock("@/components/composer/composer", () => ({
  Composer: ({ projectId: id }: { projectId?: string }) => <div>Composer {id}</div>,
}));

vi.mock("@/hooks/use-queries", () => ({
  useProjectQuery: () => ({
    data: {
      id: projectId,
      name: "Writing",
      icon: "writing",
      memoryEnabled: true,
      instructions: "",
      memoryUsedPercent: 0,
      taskCount: 1,
    },
  }),
  useChatsQuery: () => ({
    data: {
      pages: [
        {
          items: [
            {
              id: chatId,
              title: "Draft the launch post",
              lastMessageAt: "2026-09-23T05:00:00.000Z",
            },
          ],
        },
      ],
    },
    hasNextPage: false,
  }),
}));

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("ProjectDetailPage", () => {
  it("lists chats that belong to the project", () => {
    render(wrap(<ProjectDetailPage />));
    expect(screen.getByRole("heading", { name: "Writing" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Draft the launch post/ })).toHaveAttribute(
      "href",
      `/chat/${chatId}`,
    );
    expect(screen.queryByText(/Start a chat to keep conversations organized/)).not.toBeInTheDocument();
  });
});
