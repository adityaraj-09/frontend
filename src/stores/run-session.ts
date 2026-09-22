import { create } from "zustand";

export type ActiveRun = {
  chatId: string;
  runId: string;
  triggerRunId: string | null;
  realtimeToken?: string;
  messageId: string;
};

type RunSessionState = {
  active: ActiveRun | null;
  streamText: string;
  setActive: (active: ActiveRun | null) => void;
  appendStream: (chunk: string) => void;
  setStreamText: (text: string) => void;
  clear: () => void;
};

export const useRunSessionStore = create<RunSessionState>((set) => ({
  active: null,
  streamText: "",
  setActive: (active) => set({ active, streamText: "" }),
  appendStream: (chunk) => set((s) => ({ streamText: s.streamText + chunk })),
  setStreamText: (streamText) => set({ streamText }),
  clear: () => set({ active: null, streamText: "" }),
}));
