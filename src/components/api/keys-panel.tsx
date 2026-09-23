"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { keysApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import { formatAgo } from "@/lib/format";

export function KeysPanel() {
  const queryClient = useQueryClient();
  const keys = useQuery({ queryKey: queryKeys.apiKeys, queryFn: () => keysApi.list() });
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: (value: string) => keysApi.create(value),
    onSuccess: async (created) => {
      setName("");
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
    <section>
      <h2 className="text-[16px] font-semibold leading-6 text-foreground">API keys</h2>
      <p className="mt-1 text-[13px] font-medium text-muted-foreground">
        Create a key for public REST and MCP. Copy it once — it is not shown again.
      </p>
      <form
        className="mt-3 flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = name.trim();
          if (!value || create.isPending) return;
          create.mutate(value);
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Key name"
          aria-label="Key name"
          className="h-10 min-w-[220px] flex-1 rounded-[10px] bg-muted px-3 text-[14px] font-medium leading-5 text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!name.trim() || create.isPending}
          className="inline-flex h-8 items-center rounded-full bg-foreground px-3 text-[14px] font-semibold text-white disabled:opacity-40"
        >
          Create key
        </button>
      </form>
      <FormError error={create.error} />
      {revealed ? <SecretBanner value={revealed} onDismiss={() => setRevealed(null)} /> : null}
      {keys.isLoading ? (
        <p className="mt-4 text-[13px] font-medium text-muted-foreground">Loading…</p>
      ) : !(keys.data?.items ?? []).length ? (
        <p className="mt-4 text-[13px] font-medium text-muted-foreground">No API keys yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {(keys.data?.items ?? []).map((key) => (
            <li key={key.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium">{key.name}</div>
                <div className="truncate text-[13px] text-muted-foreground">
                  {key.prefix}… · {key.lastUsedAt ? `used ${formatAgo(key.lastUsedAt)}` : "never used"}
                </div>
              </div>
              <button
                type="button"
                disabled={revoke.isPending}
                className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[13px] font-semibold"
                onClick={() => revoke.mutate(key.id)}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
      <FormError error={revoke.error} />
    </section>
  );
}

function SecretBanner({ value, onDismiss }: { value: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-[16px] border border-border bg-muted p-4">
      <p className="text-[13px] font-semibold">API key — copy it now. It will not be shown again.</p>
      <code className="mt-2 block break-all text-[13px]">{value}</code>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-full bg-foreground px-3 text-[13px] font-semibold text-white"
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
