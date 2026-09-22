# Galaxy Agent Frontend

Pixel-faithful clone of the [Magica](https://magica.com/) agent chat shell, talking to the Galaxy backend. This is the frontend half of the two-repo trial split.

## Setup

```bash
pnpm install
cp .env.example .env
```

Use the **same Clerk application** as the backend. In Clerk, allow `http://localhost:3000` (and later the Vercel URL) as an origin / redirect, and set the sign-in/sign-up paths to `/sign-in` and `/sign-up`.

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
API_URL=http://localhost:4000
```

Sign in and sign up are Clerk's `<SignIn />` / `<SignUp />` components at `/sign-in` and `/sign-up`. The Magica header buttons go there (redirect, not a modal).

Run the backend on port 4000, then this app on 3000:

```bash
# backend
cd ../backend && pnpm dev --port 4000

# frontend
pnpm dev
```

Open http://localhost:3000. Same-origin `/api/*` is proxied to the backend with the Clerk session JWT.

```bash
pnpm test
pnpm typecheck
pnpm test:e2e   # Playwright; starts the Next server
```

## Architecture

```
Composer send
  → POST /api/chats (+ messages)
  → Trigger orchestrator (backend)
  → Trigger Realtime (metadata + assistant-text stream)
  → REST snapshot poll as fallback
Postgres remains the source of truth. Reloading a chat calls GET /api/chats/:id/runs for the active run, then resumes the snapshot/stream.
```

| Piece | Where |
| --- | --- |
| Typed API + Zod | `src/lib/api` |
| TanStack Query | `src/hooks`, `src/lib/query` |
| Composer / plan / attach | Zustand `src/stores/composer.ts` |
| Live run + stream | `src/hooks/use-run-realtime.ts` |
| Magica shell | `src/components/shell`, `src/components/home`, `src/components/chat` |
| Uploads | Uppy + Transloadit (tus resumable). Signed Assembly params from `POST /uploads/sign`; `transloadit:complete` calls `/uploads/complete`. |
| Message list | `@tanstack/react-virtual` in `MessageList` (variable-height turns, load-earlier) |
| Pin chats | Star on sidebar / Tasks; `PATCH /api/chats/:id { isFavorite }` |

## Design trade-offs

- **Clone Magica, don't redesign.** Spacing, composer gradient, sidebar, tool cards, and idea gallery follow the live product. Clerk replaces Magica auth; credits come from `GET /api/me`.
- **Same-origin proxy instead of CORS.** The App Router catch-all forwards `/api/*` to `API_URL` with `Authorization: Bearer <Clerk JWT>` so cookies never have to be shared across ports.
- **Realtime first, REST always.** Trigger public tokens are minted on send/snapshot. If the socket drops, the UI polls `/runs/:runId` every 2.5s.
- **Uppy is ingest only.** The Transloadit plugin uploads over tus to the signed Assembly. Transloadit is not durable storage — Magica-generated assets render from persisted URLs (and R2 when the backend copied them). Attach stays a compact Magica menu, not the Uppy Dashboard.

## What I would improve with more time

- Pixel-tune remaining Magica micro-interactions (sidebar collapse animation, idea-card hover titles).
- Cassette/replay MSW fixtures of a full Magica crop → generate turn.
