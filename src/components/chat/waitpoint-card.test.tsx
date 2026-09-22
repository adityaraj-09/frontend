import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { WaitpointCard } from "./waitpoint-card";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { WaitpointOverlay } from "@/lib/api/schemas";

vi.mock("@/lib/api/services", () => ({
  waitpointApi: {
    complete: vi.fn(async () => ({})),
  },
}));

const waitpoint: WaitpointOverlay = {
  waitpointId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  type: "PLAN",
  status: "WAITING",
  triggerWaitpointId: "tok",
  publicAccessToken: null,
  timeoutAt: new Date(Date.now() + 60_000).toISOString(),
  payload: {},
};

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("WaitpointCard", () => {
  it("shows plan copy and approve/reject", async () => {
    render(
      wrap(
        <WaitpointCard
          chatId="11111111-1111-1111-1111-111111111111"
          waitpoint={waitpoint}
        />,
      ),
    );
    expect(screen.getByText("Approve plan")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reject" }));
    const { waitpointApi } = await import("@/lib/api/services");
    expect(waitpointApi.complete).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      waitpoint.waitpointId,
      "rejected",
    );
  });
});
