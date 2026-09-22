import { create } from "zustand";

export type ActiveRun = {
  chatId: string;
  runId: string;
  triggerRunId: string | null;
  realtimeToken?: string;
  messageId: string;
};

export type PendingTurn = {
  chatId: string;
  text: string;
  userId: string;
  assistantId: string;
  createdAt: string;
};

type RunSessionState = {
  active: ActiveRun | null;
  pending: PendingTurn | null;
  streamText: string;
  setActive: (active: ActiveRun | null) => void;
  setPending: (pending: PendingTurn | null) => void;
  appendStream: (chunk: string) => void;
  setStreamText: (text: string) => void;
  clear: () => void;
};

export const useRunSessionStore = create<RunSessionState>((set) => ({
  active: null,
  pending: null,
  streamText: "",
  setActive: (active) => set({ active, streamText: "" }),
  setPending: (pending) => set({ pending }),
  appendStream: (chunk) => set((s) => ({ streamText: s.streamText + chunk })),
  setStreamText: (streamText) => set({ streamText }),
  clear: () => set({ active: null, pending: null, streamText: "" }),
}));
