import { create } from "zustand";

export type PendingFile = {
  id: string;
  name: string;
  previewUrl?: string;
  mimeType?: string;
  progress: number;
  status: "uploading" | "complete" | "error" | "cancelled";
  error?: string;
  attachmentId?: string;
};

type ComposerState = {
  text: string;
  planMode: boolean;
  attachmentIds: string[];
  pendingFiles: PendingFile[];
  draftChatId: string | null;
  error: string | null;
  setText: (text: string) => void;
  setPlanMode: (planMode: boolean) => void;
  addAttachmentIds: (ids: string[]) => void;
  removeAttachmentId: (id: string) => void;
  upsertPendingFile: (file: PendingFile) => void;
  removePendingFile: (id: string) => void;
  setDraftChatId: (id: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export const useComposerStore = create<ComposerState>((set) => ({
  text: "",
  planMode: false,
  attachmentIds: [],
  pendingFiles: [],
  draftChatId: null,
  error: null,
  setText: (text) => set({ text, error: null }),
  setPlanMode: (planMode) => set({ planMode }),
  addAttachmentIds: (ids) =>
    set((state) => ({
      attachmentIds: [...new Set([...state.attachmentIds, ...ids])],
    })),
  removeAttachmentId: (id) =>
    set((state) => ({
      attachmentIds: state.attachmentIds.filter((item) => item !== id),
    })),
  upsertPendingFile: (file) =>
    set((state) => {
      const index = state.pendingFiles.findIndex((item) => item.id === file.id);
      if (index < 0) return { pendingFiles: [...state.pendingFiles, file] };
      const next = [...state.pendingFiles];
      next[index] = { ...next[index], ...file };
      return { pendingFiles: next };
    }),
  removePendingFile: (id) =>
    set((state) => {
      const file = state.pendingFiles.find((item) => item.id === id);
      return {
        pendingFiles: state.pendingFiles.filter((item) => item.id !== id),
        attachmentIds: file?.attachmentId
          ? state.attachmentIds.filter((item) => item !== file.attachmentId)
          : state.attachmentIds,
      };
    }),
  setDraftChatId: (draftChatId) => set({ draftChatId }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      text: "",
      attachmentIds: [],
      pendingFiles: [],
      draftChatId: null,
      error: null,
    }),
}));
