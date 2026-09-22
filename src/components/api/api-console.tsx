"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SignedIn, SignedOut } from "@/lib/clerk";
import { ApiError } from "@/lib/api/client";
import { WEBHOOK_EVENTS, keysApi, webhookApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import { formatAgo } from "@/lib/format";

const PUBLIC_ROUTES = [
  { method: "POST", path: "/api/v1/completions", detail: "Start a turn. Send { text } or { prompt, chatId }." },
  { method: "POST", path: "/api/v1/chats/:chatId/completions", detail: "Start a turn in an existing chat." },
  { method: "GET", path: "/api/v1/chats", detail: "List chats for the key’s user." },
  { method: "POST", path: "/api/v1/chats", detail: "Create a chat." },
  { method: "GET", path: "/api/v1/chats/:chatId", detail: "Read one chat." },
  { method: "DELETE", path: "/api/v1/chats/:chatId", detail: "Delete a chat." },
  { method: "GET", path: "/api/v1/chats/:chatId/messages", detail: "List messages." },
  { method: "POST", path: "/api/v1/chats/:chatId/messages", detail: "Send a message and queue a run." },
  { method: "GET", path: "/api/v1/chats/:chatId/runs/:runId", detail: "Read run status." },
  { method: "POST", path: "/api/v1/tools/:toolName", detail: "Run crop_image, gpt_image_2, or merge_videos." },
  { method: "POST", path: "/api/mcp", detail: "MCP endpoint. Same API key. Tools mirror the public routes." },
] as const;

export function ApiConsole() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[880px] px-8 pb-16 pt-5">
        <h1 className="text-[30px] font-bold leading-9 text-[#1b1b1b]">API / MCP</h1>
        <p className="mt-2 max-w-[640px] text-[14px] font-medium leading-6 text-[#585858]">
          Public routes accept an API key. Create one here, then call <code className="text-[#1b1b1b]">/api/v1</code> with{" "}
          <code className="text-[#1b1b1b]">Authorization: Bearer gxk_live_…</code>
        </p>

        <SignedOut>
          <p className="mt-6 text-[14px] leading-6 text-[#585858]">Sign in to create keys and webhook endpoints.</p>
          <Link
            href="/sign-in"
            className="mt-4 inline-flex h-8 items-center rounded-full bg-[#1b1b1b] px-3 text-[14px] font-medium text-white"
          >
            Sign in
          </Link>
        </SignedOut>

        <SignedIn>
          <KeysSection />
          <WebhooksSection />
        </SignedIn>

        <section className="mt-10">
          <h2 className="text-[16px] font-semibold leading-6 text-[#1b1b1b]">Public routes</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#777777]">
            These stay on the API key. The signed-in app does not send your session to them.
          </p>
          <ul className="mt-4 divide-y divide-[#ededed] border-y border-[#ededed]">
            {PUBLIC_ROUTES.map((route) => (
              <li key={`${route.method} ${route.path}`} className="flex gap-4 py-3">
                <span className="w-16 shrink-0 text-[12px] font-medium leading-5 text-[#585858]">{route.method}</span>
                <div className="min-w-0">
                  <code className="block truncate text-[13px] leading-5 text-[#1b1b1b]">{route.path}</code>
                  <p className="text-[13px] leading-5 text-[#777777]">{route.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <pre className="mt-4 overflow-x-auto rounded-[16px] bg-[#f7f7f7] p-4 text-[13px] leading-5 text-[#1b1b1b]">{`curl -X POST /api/v1/completions \\
  -H "Authorization: Bearer gxk_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Crop this photo"}'`}</pre>
        </section>
      </div>
    </div>
  );
}

function KeysSection() {
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
    <section className="mt-8">
      <h2 className="text-[16px] font-semibold leading-6 text-[#1b1b1b]">API keys</h2>
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
          className="h-10 min-w-[220px] flex-1 rounded-[10px] bg-[#f7f7f7] px-3 text-[14px] leading-5 text-[#1b1b1b] outline-none placeholder:text-[#777777]"
        />
        <button
          type="submit"
          disabled={!name.trim() || create.isPending}
          className="inline-flex h-8 items-center rounded-full bg-[#1b1b1b] px-3 text-[14px] font-medium text-white disabled:opacity-40"
        >
          Create key
        </button>
      </form>
      <FormError error={create.error} />
      {revealed ? <SecretBanner label="API key" value={revealed} onDismiss={() => setRevealed(null)} /> : null}
      <ItemList
        empty="No API keys yet."
        loading={keys.isLoading}
        items={(keys.data?.items ?? []).map((key) => ({
          id: key.id,
          title: key.name,
          meta: `${key.prefix}… · ${key.lastUsedAt ? `used ${formatAgo(key.lastUsedAt)}` : "never used"}`,
          action: "Revoke",
          pending: revoke.isPending,
          onAction: () => revoke.mutate(key.id),
        }))}
      />
      <FormError error={revoke.error} />
    </section>
  );
}

function WebhooksSection() {
  const queryClient = useQueryClient();
  const hooks = useQuery({ queryKey: queryKeys.webhooks, queryFn: () => webhookApi.list() });
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([...WEBHOOK_EVENTS]);
  const [revealed, setRevealed] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => webhookApi.create({ url: url.trim(), events }),
    onSuccess: async (created) => {
      setUrl("");
      setRevealed(created.secret);
      await queryClient.invalidateQueries({ queryKey: queryKeys.webhooks });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => webhookApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.webhooks });
    },
  });

  return (
    <section className="mt-10">
      <h2 className="text-[16px] font-semibold leading-6 text-[#1b1b1b]">Webhook endpoints</h2>
      <p className="mt-1 text-[13px] leading-5 text-[#777777]">
        Deliveries include <code>x-galaxy-signature</code> and <code>x-galaxy-timestamp</code>. The signing secret is shown once.
      </p>
      <form
        className="mt-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!url.trim() || events.length === 0 || create.isPending) return;
          create.mutate();
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/hooks/galaxy"
            aria-label="Webhook URL"
            className="h-10 min-w-[220px] flex-1 rounded-[10px] bg-[#f7f7f7] px-3 text-[14px] leading-5 text-[#1b1b1b] outline-none placeholder:text-[#777777]"
          />
          <button
            type="submit"
            disabled={!url.trim() || events.length === 0 || create.isPending}
            className="inline-flex h-8 items-center rounded-full bg-[#1b1b1b] px-3 text-[14px] font-medium text-white disabled:opacity-40"
          >
            Add endpoint
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {WEBHOOK_EVENTS.map((eventName) => {
            const checked = events.includes(eventName);
            return (
              <label
                key={eventName}
                className="inline-flex h-8 items-center gap-2 rounded-full border border-[#ededed] bg-white px-3 text-[13px] text-[#1b1b1b]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setEvents((current) =>
                      checked ? current.filter((item) => item !== eventName) : [...current, eventName],
                    )
                  }
                />
                {eventName}
              </label>
            );
          })}
        </div>
      </form>
      <FormError error={create.error} />
      {revealed ? <SecretBanner label="Signing secret" value={revealed} onDismiss={() => setRevealed(null)} /> : null}
      <ItemList
        empty="No webhook endpoints yet."
        loading={hooks.isLoading}
        items={(hooks.data?.items ?? []).map((endpoint) => ({
          id: endpoint.id,
          title: endpoint.url,
          meta: endpoint.events.join(", "),
          action: "Delete",
          pending: remove.isPending,
          onAction: () => remove.mutate(endpoint.id),
        }))}
      />
      <FormError error={remove.error} />
    </section>
  );
}

function SecretBanner({ label, value, onDismiss }: { label: string; value: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-[16px] border border-[#ededed] bg-[#fafafa] p-4">
      <p className="text-[13px] font-medium leading-5 text-[#1b1b1b]">{label} — copy it now. It will not be shown again.</p>
      <code className="mt-2 block break-all text-[13px] leading-5 text-[#1b1b1b]">{value}</code>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-full bg-[#1b1b1b] px-3 text-[13px] font-medium text-white"
          onClick={() => {
            void navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
            });
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-full border border-[#ededed] bg-white px-3 text-[13px] font-medium text-[#1b1b1b]"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function ItemList({
  items,
  empty,
  loading,
}: {
  items: Array<{ id: string; title: string; meta: string; action: string; pending: boolean; onAction: () => void }>;
  empty: string;
  loading: boolean;
}) {
  if (loading) return <p className="mt-4 text-[13px] text-[#777777]">Loading…</p>;
  if (!items.length) return <p className="mt-4 text-[13px] text-[#777777]">{empty}</p>;
  return (
    <ul className="mt-4 divide-y divide-[#ededed] border-y border-[#ededed]">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] leading-5 text-[#1b1b1b]">{item.title}</div>
            <div className="truncate text-[13px] leading-5 text-[#777777]">{item.meta}</div>
          </div>
          <button
            type="button"
            disabled={item.pending}
            className="inline-flex h-8 shrink-0 items-center rounded-full border border-[#ededed] bg-white px-3 text-[13px] font-medium text-[#1b1b1b]"
            onClick={item.onAction}
          >
            {item.action}
          </button>
        </li>
      ))}
    </ul>
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
