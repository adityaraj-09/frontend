"use client";

import { useCallback, useEffect, useRef } from "react";
import Uppy from "@uppy/core";
import Transloadit from "@uppy/transloadit";
import { chatApi, uploadApi } from "@/lib/api/services";
import { useComposerStore } from "@/stores/composer";

/** Mirrors backend Community-plan caps. Transloadit uploads over tus (`@uppy/tus`). */
export const UPLOAD_LIMITS = {
  maxFileBytes: 512 * 1024 * 1024,
  maxFiles: 8,
  mimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "audio/mpeg",
    "audio/wav",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
  ],
} as const;

type Emitter = {
  on: (event: string, cb: (...args: never[]) => void) => void;
  off: (event: string, cb: (...args: never[]) => void) => void;
};

function emitter(uppy: Uppy): Emitter {
  return uppy as unknown as Emitter;
}

export function useUppyUpload(chatId?: string) {
  const uppyRef = useRef<Uppy | null>(null);
  const chatIdRef = useRef(chatId);
  const draftChatId = useComposerStore((s) => s.draftChatId);
  const setDraftChatId = useComposerStore((s) => s.setDraftChatId);
  const addAttachmentIds = useComposerStore((s) => s.addAttachmentIds);
  const upsertPendingFile = useComposerStore((s) => s.upsertPendingFile);
  const removePendingFile = useComposerStore((s) => s.removePendingFile);
  const setError = useComposerStore((s) => s.setError);

  chatIdRef.current = chatId ?? draftChatId ?? undefined;

  const ensureUppy = useCallback((): Uppy => {
    if (uppyRef.current) return uppyRef.current;

    const uppy = new Uppy({
      id: "galaxy-composer",
      autoProceed: true,
      restrictions: {
        maxFileSize: UPLOAD_LIMITS.maxFileBytes,
        maxNumberOfFiles: UPLOAD_LIMITS.maxFiles,
        allowedFileTypes: [...UPLOAD_LIMITS.mimeTypes],
      },
    });

    // Transloadit plugin installs Tus and points it at the assembly `tus_url`.
    uppy.use(Transloadit, {
      waitForEncoding: true,
      waitForMetadata: true,
      retryDelays: [0, 1000, 3000, 5000],
      assemblyOptions: async () => {
        let target = chatIdRef.current;
        if (!target) {
          const created = await chatApi.create({ title: "New chat" });
          target = created.id;
          chatIdRef.current = target;
          setDraftChatId(target);
        }
        const signed = await uploadApi.sign(target);
        return {
          params: signed.params,
          signature: signed.signature,
        };
      },
    });

    const onAdded = (...args: never[]) => {
      const file = args[0] as { id: string; name: string; type?: string | null; data: Blob };
      upsertPendingFile({
        id: file.id,
        name: file.name,
        progress: 0,
        status: "uploading",
        previewUrl: file.type?.startsWith("image/") ? URL.createObjectURL(file.data) : undefined,
      });
    };
    const onProgress = (...args: never[]) => {
      const file = args[0] as { id: string; name: string } | undefined;
      const progress = args[1] as { bytesUploaded?: number; bytesTotal?: number | null };
      if (!file) return;
      const total = progress.bytesTotal || 1;
      upsertPendingFile({
        id: file.id,
        name: file.name,
        progress: Math.min(100, Math.round(((progress.bytesUploaded ?? 0) / total) * 100)),
        status: "uploading",
      });
    };
    const onError = (...args: never[]) => {
      const file = args[0] as { id: string; name: string } | undefined;
      const error = args[1] as { message?: string };
      if (!file) return;
      upsertPendingFile({
        id: file.id,
        name: file.name,
        progress: 0,
        status: "error",
        error: error?.message ?? "Upload failed",
      });
    };
    const onComplete = (...args: never[]) => {
      const assembly = args[0] as unknown;
      const target = chatIdRef.current;
      if (!target) return;
      void uploadApi
        .complete(target, assembly)
        .then((saved) => {
          addAttachmentIds(saved.attachments.map((row) => row.id));
          const files = uppy.getFiles();
          files.forEach((file, index) => {
            upsertPendingFile({
              id: file.id,
              name: file.name ?? "file",
              progress: 100,
              status: "complete",
              attachmentId: saved.attachments[index]?.id,
            });
          });
        })
        .catch((error: unknown) => {
          setError(error instanceof Error ? error.message : "Could not save the upload.");
        });
    };
    const onRestriction = (...args: never[]) => {
      const error = args[1] as { message?: string } | undefined;
      setError(error?.message ?? "That file is not allowed.");
    };

    const events = emitter(uppy);
    events.on("file-added", onAdded);
    events.on("upload-progress", onProgress);
    events.on("upload-error", onError);
    events.on("transloadit:complete", onComplete);
    events.on("restriction-failed", onRestriction);

    uppyRef.current = uppy;
    return uppy;
  }, [addAttachmentIds, setDraftChatId, setError, upsertPendingFile]);

  useEffect(() => {
    ensureUppy();
    return () => {
      uppyRef.current?.destroy();
      uppyRef.current = null;
    };
  }, [ensureUppy]);

  return {
    addFiles(files: FileList | File[]) {
      const uppy = ensureUppy();
      const descriptors = Array.from(files).map((file) => ({
        name: file.name,
        type: file.type,
        data: file,
      }));
      try {
        uppy.addFiles(descriptors);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Could not add that file.");
      }
    },
    retry(fileId: string) {
      upsertPendingFile({
        id: fileId,
        name: useComposerStore.getState().pendingFiles.find((file) => file.id === fileId)?.name ?? "file",
        progress: 0,
        status: "uploading",
        error: undefined,
      });
      void uppyRef.current?.retryUpload(fileId);
    },
    cancel(fileId: string) {
      uppyRef.current?.removeFile(fileId);
      removePendingFile(fileId);
    },
  };
}
