import { create } from "zustand";

type UiState = {
  sidebarOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  settingsOpen: boolean;
  settingsTab: string;
  setSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSettingsOpen: (open: boolean) => void;
  setSettingsTab: (tab: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  searchOpen: false,
  searchQuery: "",
  settingsOpen: false,
  settingsTab: "account",
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setSettingsTab: (settingsTab) => set({ settingsTab }),
}));
