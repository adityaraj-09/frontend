import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskFilesDialog } from "./task-files-dialog";

vi.mock("@/hooks/use-queries", () => ({
  useChatFilesQuery: () => ({
    data: {
      pages: [
        {
          items: [
            {
              id: "11111111-1111-1111-1111-111111111111",
              chatId: "22222222-2222-2222-2222-222222222222",
              origin: "GENERATED",
              filename: "image file",
              mimeType: "image/png",
              byteSize: 0,
              url: "https://cdn.example/mountain.png",
              thumbnailUrl: "https://cdn.example/mountain.png",
              createdAt: new Date().toISOString(),
            },
            {
              id: "33333333-3333-3333-3333-333333333333",
              chatId: "22222222-2222-2222-2222-222222222222",
              origin: "UPLOAD",
              filename: "console.png",
              mimeType: "image/png",
              byteSize: 174_080,
              url: "https://cdn.example/console.png",
              thumbnailUrl: null,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ],
    },
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    isLoading: false,
  }),
}));

describe("TaskFilesDialog", () => {
  it("lists this task’s input and generated files", async () => {
    render(
      <TaskFilesDialog
        chatId="22222222-2222-2222-2222-222222222222"
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "All files in this task" })).toBeInTheDocument();
    expect(screen.getByText("image file")).toBeInTheDocument();
    expect(screen.getByText("console.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All 2/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Images 2/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Documents" }));
    expect(screen.queryByText("console.png")).not.toBeInTheDocument();
    expect(screen.getByText("No files in this task yet.")).toBeInTheDocument();
  });
});
