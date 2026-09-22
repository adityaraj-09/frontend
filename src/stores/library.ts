import { create } from "zustand";
import { persist } from "zustand/middleware";

type LibraryFavoritesState = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
};

export const useLibraryFavorites = create<LibraryFavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id) ? state.ids.filter((item) => item !== id) : [...state.ids, id],
        })),
      has: (id) => get().ids.includes(id),
    }),
    { name: "galaxy-library-favorites" },
  ),
);
