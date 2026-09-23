# VITALIS-1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the single Cloudflare Worker + Vite/React SPA foundation (VITALIS-1) with real preflight gates, feature layout, test stack, and CI.

**Architecture:** One Worker (Hono) for `/api/*` and `/webhooks/*`; static assets with SPA fallback; TanStack Router for public + `/admin`; Drizzle on D1; vendor ports with DI.

**Tech Stack:** Vite 8, `@cloudflare/vite-plugin`, Hono, React 19, TanStack Router/Query/Form, ky, Zustand, Zod, Tailwind 4, shadcn, Vitest 4.1.11 + `@cloudflare/vitest-pool-workers` 0.22 (`cloudflareTest` plugin, not `defineWorkersConfig`) + Browser Mode.

## Global Constraints

- Prices in centavos (later issues); Spanish UI; no vendor calls from browser.
- Pin `vitest@^4.1.11` until `@cloudflare/vitest-pool-workers` peers Vitest 5.
- `components/ui` = shadcn primitives only; single ky client in `src/web/lib/api-client.ts`.
- No real secrets in repo; `.dev.vars` gitignored.

---

### Task 1 — Walking skeleton

Branch: `feat/vitalis-1-foundation`. Install deps, `wrangler.jsonc`, `vite.config.ts`, tsconfigs, vitest projects, `GET /api/health`, scheduled stub, worker + browser smoke tests. Replace placeholder `typecheck`/`test`.

### Task 2 — Error envelope

`src/shared/api-error.ts`, `AppError`, Hono `onError`/`notFound`. Worker tests for 404 envelope and thrown `AppError`.

### Task 3 — ky + Query

`api-client.ts`, `query-client.ts`. Browser/unit test for error hook parsing envelope.

### Task 4 — Tokens + shadcn

`src/web/styles/index.css` @theme from DESIGN.md, fonts, `components.json`, Button with Tabler. Guard: ui does not import features.

### Task 5 — TanStack Router

Routes `__root`, `index`, `admin/*`. `main.tsx`, `lang="es"`. Browser tests for `/` and `/admin`.

### Task 6 — Drizzle

`drizzle.config.ts`, `createDb`, migration scripts, isolation tests.

### Task 7 — Services + ports

`Services`, clock/ids fakes, payments/mail port types + stubs, DI test, web vendor import guard.

### Task 8 — Docs + CI

README, `.dev.vars.example`, `.gitignore`, GitHub Actions with Playwright chromium cache.

---

See Plane VITALIS-1 and [ARCHITECTURE.md](../../../ARCHITECTURE.md) for acceptance criteria.
