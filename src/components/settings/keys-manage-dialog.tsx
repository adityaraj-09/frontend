"use client";

import { useState } from "react";
import { KeyRound, Plus, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import { keysApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";

const MAX_KEYS = 10;

export function KeysManageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const keys = useQuery({
    queryKey: queryKeys.apiKeys,
    queryFn: () => keysApi.list(),
    enabled: open,
  });
  const [name, setName] = useState("Default");
  const [revealed, setRevealed] = useState<string | null>(null);
  const items = keys.data?.items ?? [];
  const create = useMutation({
    mutationFn: (value: string) => keysApi.create(value),
    onSuccess: async (created) => {
      setRevealed(created.key);
      await queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys });
    },
  });
  const revoke = useMutation({
    mutationFn: (id: string) => keysApi.revoke(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(560px,94vw)] max-w-none gap-0 overflow-hidden rounded-[28px] bg-background p-0 text-foreground sm:max-w-none"
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-2">
          <div>
            <DialogTitle className="flex items-center gap-2 text-[16px] font-semibold">
              <KeyRound className="size-4" />
              API Keys {items.length}/{MAX_KEYS}
            </DialogTitle>
            <p className="mt-2 max-w-[420px] text-[13px] font-medium leading-5 text-muted-foreground">
              Create credentials for the REST API and MCP server. Keep keys private and revoke any
              credential you no longer trust.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <form
            className="rounded-[20px] border border-border px-4 py-4"
            onSubmit={(event) => {
              event.preventDefault();
              const value = name.trim();
              if (!value || create.isPending || items.length >= MAX_KEYS) return;
              create.mutate(value);
            }}
          >
            <p className="text-[14px] font-semibold">Create a new key</p>
            <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">
              Add a recognizable label so you can identify this key later.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Default"
                aria-label="Key name"
                className="h-10 min-w-[180px] flex-1 rounded-[12px] bg-muted px-3 text-[14px] font-medium outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!name.trim() || create.isPending || items.length >= MAX_KEYS}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-[13px] font-semibold text-background disabled:opacity-40"
              >
                <Plus className="size-3.5" />
                Create key
              </button>
            </div>
            <FormError error={create.error} />
          </form>

          {revealed ? <SecretBanner value={revealed} onDismiss={() => setRevealed(null)} /> : null}

          <ul className="mt-3 space-y-2">
            {items.map((key) => (
              <li key={key.id} className="rounded-[20px] border border-border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold">{key.name}</p>
                    <p className="mt-0.5 truncate text-[13px] font-medium text-muted-foreground">
                      {key.prefix}•••••••• · {formatKeyDate(key.createdAt)}
                    </p>
                    <p className="mt-2 text-[12px] font-medium text-muted-foreground">100/min · 10000/day</p>
                  </div>
                  <button
                    type="button"
                    disabled={revoke.isPending}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full text-[13px] font-semibold text-[#e11d48] hover:bg-red-50"
                    onClick={() => revoke.mutate(key.id)}
                  >
                    <Trash2 className="size-3.5" />
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <FormError error={revoke.error} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatKeyDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
}

function SecretBanner({ value, onDismiss }: { value: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-[16px] border border-border bg-muted/40 p-4">
      <p className="text-[13px] font-semibold">API key — copy it now. It will not be shown again.</p>
      <code className="mt-2 block break-all text-[13px]">{value}</code>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-full bg-foreground px-3 text-[13px] font-semibold text-background"
          onClick={() => void navigator.clipboard.writeText(value).then(() => setCopied(true))}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[13px] font-semibold"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Request failed";
  return (
    <p role="alert" className="mt-2 text-[13px] text-[#b42318]">
      {message}
    </p>
  );
}
