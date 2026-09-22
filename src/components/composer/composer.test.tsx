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
        { id: "file-1", name: "dog.png", progress: 40, status: "uploading" },
      ],
    });
    render(wrap(<Composer />));
    expect(screen.getByText("dog.png")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
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
