# Project Vitalis — agent instructions

Mexico-only e-commerce for native medicine and Yoruba-related products. Spanish UI, prices in MXN (stored as centavos), shipping inside Mexico only. One Cloudflare Worker (Hono + React/Vite), D1 via Drizzle, R2 for photos, Mercado Pago SPEI, Resend mail, Better Auth.

## Single source of truth

- **This file** (`AGENTS.md`) is the only project instruction file. Do not add `.cursorrules`, `.cursor/rules/`, `.claude/`, duplicate `AGENTS.md` copies, or a second skills directory.
- **Skills** live only under [`.agents/skills/`](.agents/skills/). Do not install skills elsewhere in this repo.
- **Architecture decisions**: [ARCHITECTURE.md](ARCHITECTURE.md) (summary) and [docs/superpowers/specs/2026-09-22-store-architecture-design.md](docs/superpowers/specs/2026-09-22-store-architecture-design.md) (behavioral contract, failures, tests).
- **Skill versions**: [`.agents/skills/MANIFEST.md`](.agents/skills/MANIFEST.md).

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm setup` | Point git at `.githooks/` (run once per clone) |
| `pnpm check` | Format + safe lint fixes (Biome) |
| `pnpm lint` | Verify lint/format (CI-style, must pass before PR) |
| `pnpm format` | Format only |
| `pnpm typecheck` | TypeScript (placeholder until app scaffold) |
| `pnpm test` | Tests (placeholder until runner exists) |
| `pnpm preflight` | Full gate: check → lint → typecheck → test |

PR creation is **blocked by a Cursor hook** until `pnpm preflight` passes. Run preflight yourself before asking for a PR.

## Non-negotiables

- **Vendors**: The browser never calls Mercado Pago, Resend, or OAuth providers directly. Only Hono modules write: catalog, stock, orders, payments, auth, mail.
- **Money**: Store prices in **centavos**; display MXN with two decimals.
- **Catalog**: Every sellable thing is a **variant**; price and stock on the variant.
- **Stock**: On hand, reserved, available (= on hand − reserved). Sell only from available. Checkout reserves in one transaction (3-day hold).
- **Layout**: Features own routes, schema, service, screens, queries. Shared: `src/shared` (Zod), `src/web/components/ui` (shadcn primitives only), `src/web/lib/api-client.ts` (ky).
- **Client packages**: TanStack Query (server data), Zustand (cart + short UI flows only), TanStack Form + shadcn fields, Zod both sides, Tabler icons (not Lucide in shipped UI).
- **Clean boundaries**: Routes without SQL; SQL without Mercado Pago calls; payments uses a port for tests.

## Workflow

1. **Brainstorm** (`brainstorming`) before new features or behavior changes.
2. **Plan** (`writing-plans`) after design approval.
3. **Implement** with **TDD** (`test-driven-development`) where behavior is specified.
4. **Debug** with `systematic-debugging`; finish with `verification-before-completion`.
5. **Preflight** (`pnpm preflight`) before any PR.
6. **Ship** using `shipping-a-change` and `finishing-a-development-branch`.

## Skill index

| Skill | Use when |
| --- | --- |
| `vitalis-conventions` | Any code in this repo — modules, stock, money, layout |
| `shipping-a-change` | Before PR or push |
| `using-superpowers` | Starting work — how to invoke skills |
| `brainstorming` | New features, design, behavior |
| `writing-plans` / `executing-plans` | Planned implementation |
| `test-driven-development` | Specified behavior |
| `systematic-debugging` | Bugs and failures |
| `verification-before-completion` | Claiming done |
| `requesting-code-review` / `receiving-code-review` | Reviews |
| `clean-code-principles` | SOLID, DRY, KISS, structure |
| `vercel-react-best-practices` | React performance |
| `frontend-design` / `impeccable` | UI/UX, polish, audit |
| `shadcn` | Components and registry |
| `cloudflare`, `workers-best-practices`, `wrangler`, `web-perf` | Worker, D1, deploy, perf |
| `better-auth-best-practices`, `email-and-password-best-practices`, `better-auth-security-best-practices`, `create-auth` | Auth |
| `resend`, `react-email`, `email-best-practices` | Transactional email |
| `webapp-testing` | Browser/UI verification |

## Cursor plugins

Project skills in `.agents/skills/` override global Cursor plugins. Disable user-level **Superpowers**, **Cloudflare**, **Resend**, and **shadcn** plugins for this workspace so agents do not read duplicate skill copies from `~/.cursor/plugins/cache/`. Steps: [`.agents/RETIRE-CURSOR-PLUGINS.md`](.agents/RETIRE-CURSOR-PLUGINS.md).
