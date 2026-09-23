import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { SettingsDialog } from "./settings-dialog";
import { useUiStore } from "@/stores/ui";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/clerk", () => ({
  useUser: () => ({
    user: { primaryEmailAddress: { emailAddress: "adi@example.com" }, delete: vi.fn() },
  }),
  useClerk: () => ({ openUserProfile: vi.fn(), signOut: vi.fn() }),
}));

vi.mock("@/lib/api/services", () => ({
  keysApi: { list: async () => ({ items: [] }), create: vi.fn(), revoke: vi.fn() },
  meApi: { get: async () => ({ creditBalance: "79.71" }) },
}));

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("SettingsDialog", () => {
  it("opens Magica account settings and the API keys manager", async () => {
    useUiStore.setState({ settingsOpen: true, settingsTab: "account" });
    render(wrap(<SettingsDialog />));
    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByText("adi@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "API Keys" }));
    expect(screen.getByRole("heading", { name: "API Keys" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Manage/ }));
    expect(screen.getByLabelText("Key name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create key" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    await userEvent.click(screen.getByRole("button", { name: "Preferences" }));
    expect(screen.getByRole("heading", { name: "Preferences" })).toBeInTheDocument();
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });
});
