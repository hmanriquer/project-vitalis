# Project Vitalis

Mexico-only e-commerce for native medicine and Yoruba-related products. See [AGENTS.md](AGENTS.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

## Prerequisites

- Node.js 24 LTS (`engines.node`)
- [pnpm](https://pnpm.io/) via Corepack (`packageManager` in `package.json`)
- Chromium for Vitest Browser Mode: `pnpm exec playwright install chromium`

## Setup

```bash
pnpm install
pnpm setup
cp .dev.vars.example .dev.vars   # placeholders only
```

## Development

One command serves the React SPA and the Cloudflare Worker together:

```bash
pnpm dev
```

- Public shop: `/`
- Admin shell: `/admin`
- API health: `GET /api/health`

## Quality gate

```bash
pnpm preflight   # check → lint → typecheck → test
```

## Layout

```text
src/worker/features/   catalog, stock, orders, payments, auth, mail
src/web/features/      shop, cart, checkout, account, admin
src/web/components/ui/ shadcn primitives only
src/web/lib/           api-client.ts (ky), query-client
src/shared/            Zod schemas shared with the Worker
```

## Database (local D1)

```bash
pnpm db:generate
pnpm db:migrate:local
```
