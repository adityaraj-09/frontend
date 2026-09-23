import { create } from "zustand";

type UiState = {
  sidebarOpen: boolean;
  artifact: { title: string; url: string; mimeType: string } | null;
  searchOpen: boolean;
  searchQuery: string;
  settingsOpen: boolean;
  settingsTab: string;
  setSidebarOpen: (open: boolean) => void;
  setArtifact: (artifact: UiState["artifact"]) => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSettingsOpen: (open: boolean) => void;
  setSettingsTab: (tab: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  artifact: null,
  searchOpen: false,
  searchQuery: "",
  settingsOpen: false,
  settingsTab: "account",
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setArtifact: (artifact) => set({ artifact }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setSettingsTab: (settingsTab) => set({ settingsTab }),
}));
