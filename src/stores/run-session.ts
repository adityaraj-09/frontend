import { create } from "zustand";

export type ActiveRun = {
  chatId: string;
  runId: string;
  triggerRunId: string | null;
  realtimeToken?: string;
  messageId: string;
};

export type PendingAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  url: string;
  thumbnailUrl?: string | null;
};

export type PendingTurn = {
  chatId: string;
  text: string;
  userId: string;
  assistantId: string;
  createdAt: string;
  attachments: PendingAttachment[];
};

type RunSessionState = {
  active: ActiveRun | null;
  pending: PendingTurn | null;
  streamText: string;
  setActive: (active: ActiveRun | null) => void;
  patchActive: (active: ActiveRun) => void;
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
  patchActive: (active) =>
    set((state) => {
      const sameRun = state.active?.chatId === active.chatId && state.active.runId === active.runId;
      return {
        active: state.active && sameRun ? { ...state.active, ...active } : active,
        streamText: sameRun ? state.streamText : "",
      };
    }),
  setPending: (pending) => set({ pending }),
  appendStream: (chunk) => set((s) => ({ streamText: s.streamText + chunk })),
  setStreamText: (streamText) => set({ streamText }),
  clear: () => set({ active: null, pending: null, streamText: "" }),
}));
