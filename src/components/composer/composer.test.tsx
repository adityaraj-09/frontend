import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Composer } from "./composer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useComposerStore } from "@/stores/composer";

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isSignedIn: true, user: { id: "user_1" } }),
  useClerk: () => ({ openSignIn: vi.fn() }),
  useAuth: () => ({ isSignedIn: true, getToken: async () => "tok" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api/services", () => ({
  chatApi: { create: vi.fn() },
  messageApi: { send: vi.fn() },
  runApi: { cancel: vi.fn() },
  uploadApi: { sign: vi.fn(), complete: vi.fn(), library: vi.fn() },
}));

const cancel = vi.fn();
const retry = vi.fn();

vi.mock("@/hooks/use-uppy-upload", () => ({
  useUppyUpload: () => ({
    addFiles: vi.fn(),
    retry,
    cancel,
  }),
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
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>
  );
}

describe("Composer", () => {
  afterEach(() => {
    useComposerStore.setState({
      text: "",
      planMode: false,
      attachmentIds: [],
      pendingFiles: [],
      draftChatId: null,
      error: null,
    });
    cancel.mockClear();
    retry.mockClear();
  });

  it("keeps send disabled until there is text", async () => {
    render(wrap(<Composer />));
    const send = screen.getByRole("button", { name: "Send message" });
    expect(send).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Assign a task or ask anything"), "Crop this photo");
    expect(send).toBeEnabled();
  });

  it("shows upload progress and blocks send until the file finishes", async () => {
    useComposerStore.setState({
      text: "Crop this photo",
      pendingFiles: [
        { id: "file-1", name: "dog.png", progress: 40, status: "uploading", previewUrl: "blob:dog" },
      ],
    });
    render(wrap(<Composer />));
    expect(screen.getByRole("img", { name: "dog.png" })).toHaveAttribute("src", "blob:dog");
    expect(screen.getByRole("button", { name: "Remove dog.png" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("opens the full library dialog when selecting an asset for a new task", async () => {
    const user = userEvent.setup();
    render(wrap(<Composer />));
    await user.click(screen.getByRole("button", { name: "Attach files" }));
    await user.click(screen.getByRole("button", { name: "Select Asset" }));
    expect(screen.getByRole("heading", { name: "Select from library" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search media...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "My Uploads" })).toBeInTheDocument();
    await user.click(screen.getAllByRole("img", { name: "chart.png" })[0]);
    expect(useComposerStore.getState().attachmentIds).toEqual(["11111111-1111-1111-1111-111111111111"]);
    expect(screen.queryByText("attached")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "chart.png" })).toHaveAttribute("src", "https://cdn.example/chart.png");
    expect(screen.getByRole("button", { name: "Remove chart.png" })).toBeInTheDocument();
  });

  it("renders a library-only attachment as a normal thumbnail", () => {
    useComposerStore.setState({
      attachmentIds: ["11111111-1111-1111-1111-111111111111"],
    });
    render(wrap(<Composer />));
    expect(screen.getByRole("img", { name: "chart.png" })).toHaveAttribute(
      "src",
      "https://cdn.example/chart.png",
    );
    expect(screen.queryByText("attached")).not.toBeInTheDocument();
  });

  it("retries a failed tus upload from the chip", async () => {
    useComposerStore.setState({
      pendingFiles: [
        { id: "file-1", name: "dog.png", progress: 0, status: "error", error: "network" },
      ],
    });
    render(wrap(<Composer />));
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledWith("file-1");
  });
});
