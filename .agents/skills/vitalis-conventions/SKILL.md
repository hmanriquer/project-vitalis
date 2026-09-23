---
name: vitalis-conventions
description: Project Vitalis architecture bindings for Cloudflare Worker + React shop. Use when adding routes, features, stock, orders, payments, auth, mail, Drizzle/D1, or any code under src/. Covers centavos, variants, stock counters, module boundaries, and feature layout from ARCHITECTURE.md.
---

# Vitalis conventions

Read [ARCHITECTURE.md](../../../ARCHITECTURE.md) and the behavioral spec at [docs/superpowers/specs/2026-09-22-store-architecture-design.md](../../../docs/superpowers/specs/2026-09-22-store-architecture-design.md) before changing behavior.

## Stack

- One Worker: Hono for `/api/*` and webhooks; Vite React static assets.
- D1 + Drizzle; R2 for product photos (browser resizes before upload).
- Mercado Pago SPEI (`clabe`, `P3D` hold); Resend for mail; Better Auth for customers and admin.

## Module boundaries (only these write)

| Module | Owns |
| --- | --- |
| catalog | Products, variants, categories, prices |
| stock | Every quantity change, one transaction each |
| orders | Site checkouts and admin-typed WhatsApp sales |
| payments | SPEI creation and webhook handling |
| auth | Customer accounts and admin login |
| mail | Resend; failed send does not roll back stock or orders |

Routes do not contain SQL. SQL does not call Mercado Pago. Payments depends on a port for a fake client in tests.

## Feature layout

```text
src/worker/features/catalog|stock|orders|payments|auth|mail
src/web/features/shop|cart|checkout|account|admin
src/web/components/ui          shadcn primitives only
src/web/lib/api-client.ts      ky instance
src/shared                     Zod schemas both sides import
```

Split a file when it gains a second responsibility.

## Domain rules

- **Money**: integers in centavos; display MXN with two decimals.
- **Variant**: every sellable SKU is a variant; simple product = one variant.
- **Order lines**: store unit price at sale time; catalog changes do not rewrite orders.
- **Stock**: `available = on_hand - reserved`. Cart does not hold units. Checkout reserves in one transaction for 3 days. Payment confirm removes from both; release hold removes reserved only.
- **Naming**: use domain verbs in code — reserve, release, confirm — not generic CRUD where the spec names an action.

## Client data

- TanStack Query for all server reads/writes (products, stock, orders, dashboard).
- Zustand only for cart until checkout and short UI flows (e.g. checkout steps).
- TanStack Form + shadcn `Field` / `Input` / `Button`; Zod shared with Hono.
- Tabler icons in shipped UI; replace Lucide if a shadcn template includes it.

## Drizzle / D1

- Indexed queries; one transaction per checkout, stock change, or payment notice.
- Stay within free-tier limits documented in ARCHITECTURE.md.

## UI

- Spanish copy; Mexico-only shipping; guest checkout with token; admin in Spanish where applicable.
- Use shadcn primitives from `components/ui`; build feature-specific UI inside the feature until a second feature needs the same primitive.
