import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DefaultModel = "magica-auto";
export type ReplyLanguage = "auto" | "en";

type SettingsState = {
  defaultModel: DefaultModel;
  language: ReplyLanguage;
  setGeneral: (input: { defaultModel: DefaultModel; language: ReplyLanguage }) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultModel: "magica-auto",
      language: "auto",
      setGeneral: (input) => set(input),
    }),
    { name: "galaxy-settings" },
  ),
);
