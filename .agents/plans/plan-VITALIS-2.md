# Plan — VITALIS-2: Model D1 data and enforce transactional stock invariants

**Issue:** [VITALIS-2: 📦 | Backend | Model D1 data and enforce transactional stock invariants](http://localhost/project-themis/projects/3fc00cf1-804e-4048-bc45-37866dae8b21/issues/VITALIS-2)  
**Branch:** `feat/vitalis-2-stock-model`  
**Labels:** `stock`, `database`, `backend`, `MVP` (Backend-only: all cards are `data/api` lane; no `ui` lane)  
**Primary role:** `backend` (all cards `data/api`)  
**Suggested tool (Card 1):** opencode (fallback: codex or `vitalis-fullstack` via Cursor if quota exhausted)  
**Status:** `ready` (0 open questions)

---

## Overview

Define the durable commerce data model on Cloudflare D1 using Drizzle ORM and make the Stock feature (`src/worker/features/stock`) the sole writer of inventory quantities.

This plan models the complete schema required for native medicine and Yoruba products: categories, products, photos, variants (with centavo pricing and stock counters), store settings (fixed Mexico shipping and WhatsApp contact), orders (with buyer snapshots and Mexican postal addresses), order lines, reservations (3-day holds), and stock audit logs.

It implements the atomic stock service operations (`reserveStock`, `confirmReservation`, `releaseReservation`, `recordWhatsAppSale`, `manualStockCorrection`, `returnPaidOrderStock`) with conditional update arbitration against concurrency races, transaction rollback on multi-item shortages, mandatory justification for manual adjustments, and order snapshot immutability.

---

## Architectural Boundaries and Invariants

1. **Backend-Only Scope:** No frontend UI changes or route additions in `src/web/`. All work is confined to `src/worker/db/`, `migrations/`, and `src/worker/features/stock/` (and order snapshot tests).
2. **Variants as Sole Sellable Entity:** Every sellable item is a variant. Price and stock live exclusively on variants. Simple products have a single default variant.
3. **Money in Centavos:** All prices, unit rates, shipping charges, and order totals are stored as non-negative integers in centavos.
4. **Stock Counters & Invariants:**
   - `on_hand`: physical units currently in inventory.
   - `reserved`: units held for pending orders awaiting payment.
   - `available`: dynamically derived as `on_hand - reserved`.
   - Invariant: `on_hand >= 0`, `reserved >= 0`, and `on_hand >= reserved`. Available stock can never go negative.
5. **Stock Feature as Sole Writer:** Catalog, Orders, and Payments modules never execute direct SQL updates on variant stock quantities. All mutations flow through `src/worker/features/stock/service.ts`.
6. **Atomic Transitions & Concurrency Arbitration:**
   - Checkouts reserve stock via conditional atomic updates: `UPDATE variants SET reserved = reserved + ? WHERE id = ? AND (on_hand - reserved) >= ?`.
   - Two concurrent reservations competing for the last available unit result in exactly one reservation and one shortage rejection.
   - If any item in a multi-line checkout is short, the entire transaction rolls back.
7. **Hold Lifecycles & Sales Paths:**
   - `confirmReservation`: drops both `reserved` and `on_hand` by the held quantity once; deletes reservation rows.
   - `releaseReservation`: drops `reserved` only by the held quantity once; leaves `on_hand` intact; deletes reservation rows.
   - `recordWhatsAppSale`: immediately decrements `on_hand` only from available units; does NOT alter `reserved`; does NOT create reservation records.
   - `returnPaidOrderStock`: atomically increments `on_hand` when an unshipped paid order is cancelled.
   - Shipping an order never alters stock counters.
8. **Audit Trail for Corrections:** Every manual stock correction requires an explicit non-empty `reason` string and is persisted in `stock_audit_logs`. A correction cannot set `on_hand < reserved`.
9. **Order Snapshot Immutability:** Orders and order lines preserve the exact buyer information, Mexican shipping address, unit prices in centavos, and shipping fee agreed upon at checkout. Later catalog or settings updates must not alter existing orders.

---

## Task Cards

### Card 1 · Define Drizzle D1 schemas, constraints, indexes, and initial migrations

**Lane:** data/api  
**Role:** backend  
**Size:** M (4 files)

**Files:**
1. `src/worker/db/schema.ts` — Drizzle SQLite schema for categories, products, product_photos, variants, store_settings, orders, order_lines, reservations, and stock_audit_logs with CHECK constraints and indexes.
2. `src/worker/db/client.ts` — Bind schema to Drizzle client and export typed DB helper.
3. `migrations/0000_initial_schema.sql` — Generated D1 migration file via Drizzle Kit.
4. `src/worker/db/schema.test.ts` — Vitest tests on local D1 validating table structure, constraints, column types, and foreign key relations.

**Description:**
- In `src/worker/db/schema.ts`, implement tables using `drizzle-orm/sqlite-core`:
  - `categories`: `id` (text PK), `name` (text not null), `slug` (text unique not null), `created_at` (integer timestamp not null), `updated_at` (integer timestamp not null).
  - `products`: `id` (text PK), `name` (text not null), `slug` (text unique not null), `description` (text not null), `category_id` (text references categories.id), `is_active` (integer boolean default 1), `created_at`, `updated_at`.
  - `product_photos`: `id` (text PK), `product_id` (text references products.id), `url` (text not null), `alt` (text), `sort_order` (integer default 0), `created_at`.
  - `variants`: `id` (text PK), `product_id` (text references products.id not null), `name` (text not null), `price_in_centavos` (integer not null), `photo_id` (text), `on_hand` (integer not null default 0), `reserved` (integer not null default 0), `is_active` (integer boolean default 1), `created_at`, `updated_at`. Add check constraint `variants_stock_invariants`: `on_hand >= 0 AND reserved >= 0 AND on_hand >= reserved`.
  - `store_settings`: `id` (text PK, default `'default'`), `shipping_fee_in_centavos` (integer not null default 0), `whatsapp_phone_number` (text not null default ''), `updated_at` (integer timestamp not null).
  - `orders`: `id` (text PK), `source` (text not null, `'site' | 'whatsapp'`), `status` (text not null, `'pending_payment' | 'paid' | 'shipped' | 'cancelled' | 'expired' | 'needs_review'`), `guest_token` (text unique not null), `user_id` (text nullable for future customer accounts), `customer_name` (text not null), `customer_phone` (text not null), `customer_email` (text not null), `address_street` (text not null), `address_exterior_number` (text not null), `address_interior_number` (text), `address_colonia` (text not null), `address_city` (text not null), `address_state` (text not null), `address_postal_code` (text not null), `shipping_fee_in_centavos` (integer not null), `total_in_centavos` (integer not null), `payment_reference` (text), `paid_at` (integer timestamp), `carrier` (text), `tracking_number` (text), `notes` (text), `created_at` (integer timestamp not null), `updated_at` (integer timestamp not null).
  - `order_lines`: `id` (text PK), `order_id` (text references orders.id not null), `variant_id` (text references variants.id not null), `quantity` (integer not null), `unit_price_in_centavos` (integer not null), `total_in_centavos` (integer not null), `created_at`.
  - `reservations`: `id` (text PK), `order_id` (text references orders.id not null), `variant_id` (text references variants.id not null), `quantity` (integer not null), `expires_at` (integer timestamp not null), `created_at`.
  - `stock_audit_logs`: `id` (text PK), `variant_id` (text references variants.id not null), `previous_on_hand` (integer not null), `new_on_hand` (integer not null), `reason` (text not null), `actor_id` (text), `created_at` (integer timestamp not null).
  - Add indexes:
    - `orders`: `idx_orders_status` on `status`, `idx_orders_paid_at` on `paid_at`, `idx_orders_email` on `customer_email`, `idx_orders_guest_token` on `guest_token`.
    - `reservations`: `idx_reservations_expires_at` on `expires_at`, `idx_reservations_order` on `order_id`.
    - `variants`: `idx_variants_product` on `product_id`, `idx_variants_stock` on `(on_hand, reserved)`.
    - `products`: `idx_products_category` on `category_id`, `idx_products_slug` on `slug`.
- Run `pnpm db:generate` to produce `migrations/0000_initial_schema.sql`.
- In `src/worker/db/schema.test.ts`, write tests verifying:
  - Table schemas apply and CRUD queries execute via Drizzle on local D1.
  - Variant check constraints reject negative `on_hand`, negative `reserved`, or `on_hand < reserved`.
  - All price and fee columns enforce integer centavo values.

**Acceptance criteria:**
- [ ] Schema declares all domain tables (`categories`, `products`, `product_photos`, `variants`, `store_settings`, `orders`, `order_lines`, `reservations`, `stock_audit_logs`).
- [ ] All money values are strictly integer centavos (`price_in_centavos`, `shipping_fee_in_centavos`, `unit_price_in_centavos`, `total_in_centavos`).
- [ ] Variants enforce `on_hand >= 0`, `reserved >= 0`, and `on_hand >= reserved`.
- [ ] Order source accepts `'site'` and `'whatsapp'`; status accepts `'pending_payment'`, `'paid'`, `'shipped'`, `'cancelled'`, `'expired'`, `'needs_review'`.
- [ ] Buyer snapshot Mexican address and unguessable `guest_token` fields are defined on `orders`.
- [ ] Indexes for reservation expiration, order status/paid_at/email, and variants are specified.
- [ ] `migrations/0000_initial_schema.sql` is generated and cleanly runnable.
- [ ] Schema tests in `src/worker/db/schema.test.ts` pass with 100% assertions green on local D1.
- [ ] `pnpm typecheck` passes with zero errors.

**Verification command:**
```bash
pnpm vitest run src/worker/db/schema.test.ts && pnpm typecheck
```

---

### Card 2 · Implement Stock Service atomic operations (reserve, confirm, release, WhatsApp sale)

**Lane:** data/api  
**Role:** backend  
**Size:** M (3 files)

**Files:**
1. `src/worker/features/stock/types.ts` — Type definitions for stock items, reservation parameters, and error types (`StockShortageError`, `InvalidStockOperationError`).
2. `src/worker/features/stock/service.ts` — Stock service implementing `reserveStock`, `confirmReservation`, `releaseReservation`, and `recordWhatsAppSale`.
3. `src/worker/features/stock/service.test.ts` — Vitest integration tests against local D1 covering each transition, concurrency races, and transactional rollback.

**Description:**
- In `src/worker/features/stock/types.ts`:
  - Define `StockReservationItem = { variantId: string; quantity: number }`.
  - Define `StockShortageError` containing `variantId`, `requested`, and `available`.
  - Define `InvalidStockOperationError` for disallowed state changes.
- In `src/worker/features/stock/service.ts`, implement:
  - `reserveStock(db, items: StockReservationItem[], orderId: string, expiresAt: Date)`:
    - Wraps operations in a D1 transaction (`db.batch` or transaction block).
    - For each item, executes conditional update:
      `UPDATE variants SET reserved = reserved + ? WHERE id = ? AND (on_hand - reserved) >= ?`
    - Checks affected rows. If any item fails because available stock is insufficient, aborts the transaction and throws `StockShortageError` with the offending `variantId`.
    - Inserts corresponding rows into `reservations`.
  - `confirmReservation(db, orderId: string)`:
    - In a transaction, queries active reservations for `orderId`.
    - If none found, returns cleanly (idempotent).
    - For each reservation, decrements `reserved = reserved - ?` and `on_hand = on_hand - ?`.
    - Deletes the reservation rows for `orderId`.
  - `releaseReservation(db, orderId: string)`:
    - In a transaction, queries active reservations for `orderId`.
    - If none found, returns cleanly (idempotent).
    - For each reservation, decrements `reserved = reserved - ?` (leaves `on_hand` unchanged).
    - Deletes the reservation rows for `orderId`.
  - `recordWhatsAppSale(db, items: StockReservationItem[], orderId?: string)`:
    - In a transaction, for each item, decrements `on_hand` directly:
      `UPDATE variants SET on_hand = on_hand - ? WHERE id = ? AND (on_hand - reserved) >= ?`
    - Does NOT modify `reserved` and does NOT insert reservation rows.
    - If available stock is insufficient for any item, rolls back and throws `StockShortageError`.
- In `src/worker/features/stock/service.test.ts`:
  - Test successful multi-item reservation increments `reserved` and records reservation records.
  - Test shortage on one item in a multi-item batch rolls back the entire batch.
  - Test confirming reservation reduces both `reserved` and `on_hand` once.
  - Test releasing reservation reduces only `reserved` once, preserving `on_hand`.
  - Test WhatsApp sale decrements `on_hand` directly without creating reservations or modifying `reserved`.
  - Test two concurrent reservations for the last available unit: exactly one succeeds and one receives `StockShortageError`, with no negative counters.

**Acceptance criteria:**
- [ ] `reserveStock` increments `reserved` and records `reservations` in a single transaction.
- [ ] If available units (`on_hand - reserved`) cannot cover requested quantity, transaction aborts and `StockShortageError` is thrown naming the short variant.
- [ ] `confirmReservation` reduces both `reserved` and `on_hand` once and deletes reservation rows.
- [ ] `releaseReservation` reduces only `reserved` once, leaves `on_hand` unchanged, and deletes reservation rows.
- [ ] `recordWhatsAppSale` consumes only from available units, decrements `on_hand` directly, and never creates reservations.
- [ ] WhatsApp sale is rejected if available units are insufficient without mutating any quantities.
- [ ] Concurrent race on the last available unit yields exactly one reservation and one shortage error.
- [ ] Local D1 tests in `src/worker/features/stock/service.test.ts` pass cleanly.

**Verification command:**
```bash
pnpm vitest run src/worker/features/stock/service.test.ts && pnpm typecheck
```

---

### Card 3 · Implement Stock Corrections, Order Returns, Invariants, and Price Snapshot Immutability

**Lane:** data/api  
**Role:** backend  
**Size:** M (4 files)

**Files:**
1. `src/worker/features/stock/service.ts` — Extend stock service with `manualStockCorrection` and `returnPaidOrderStock`.
2. `src/worker/features/stock/audit.test.ts` — Tests for manual correction reason validation, invariant checks, and audit logging.
3. `src/worker/features/stock/invariants.test.ts` — Comprehensive invariant tests for cancellations, shipping no-op, and race arbitration.
4. `src/worker/features/orders/snapshot.test.ts` — Tests verifying order line centavo prices and shipping fee immutability when catalog prices or settings change.

**Description:**
- In `src/worker/features/stock/service.ts`:
  - Implement `manualStockCorrection(db, params: { variantId: string; newOnHand: number; reason: string; actorId?: string })`:
    - Validates that `reason` is provided and non-empty (trims whitespace; throws `AppError('invalid_argument', 'Se requiere un motivo para el ajuste manual', 400)` if empty).
    - Queries variant's current `on_hand` and `reserved`.
    - If `newOnHand < current.reserved`, throws `AppError('invalid_stock_invariant', 'El stock físico no puede ser menor a las unidades reservadas', 400)`.
    - In a transaction, updates `variants.on_hand = newOnHand` and inserts a row into `stock_audit_logs` with `previous_on_hand`, `new_on_hand`, `reason`, and `actor_id`.
  - Implement `returnPaidOrderStock(db, items: Array<{ variantId: string; quantity: number }>)`:
    - In a transaction, atomically increments `on_hand = on_hand + quantity` for each variant.
    - Used when cancelling an unshipped paid order.
- In `src/worker/features/stock/audit.test.ts`:
  - Verify manual correction requires non-empty reason.
  - Verify manual correction rejects `newOnHand < reserved`.
  - Verify `stock_audit_logs` records previous and new values, reason, actor, and timestamp.
- In `src/worker/features/stock/invariants.test.ts`:
  - Verify cancelling an unshipped paid order puts units back on hand.
  - Verify marking an order shipped does not alter any stock counters.
  - Verify multi-item rollback behavior when database write fails.
- In `src/worker/features/orders/snapshot.test.ts`:
  - Seed an order with lines and shipping fee in centavos.
  - Update catalog variant price in `variants` table and store shipping fee in `store_settings`.
  - Query order and lines; assert original unit price, total, and shipping snapshot remain identical.

**Acceptance criteria:**
- [ ] `manualStockCorrection` rejects empty or missing reason strings.
- [ ] `manualStockCorrection` rejects any correction that sets `on_hand < reserved`.
- [ ] `manualStockCorrection` writes an audit log to `stock_audit_logs` with before/after counts and reason.
- [ ] `returnPaidOrderStock` atomically restores paid units to `on_hand`.
- [ ] Shipping an order is verified to never change stock counters.
- [ ] Order lines and shipping snapshot preserve agreed centavo amounts regardless of subsequent catalog or settings changes.
- [ ] Automated tests in `audit.test.ts`, `invariants.test.ts`, and `snapshot.test.ts` pass on local D1.
- [ ] Full preflight gate (`pnpm preflight` or `pnpm check && pnpm lint && pnpm typecheck && pnpm test`) passes with zero warnings or errors.

**Verification command:**
```bash
pnpm vitest run src/worker/features/stock/audit.test.ts src/worker/features/stock/invariants.test.ts src/worker/features/orders/snapshot.test.ts && pnpm preflight
```

---

## Audit brief

After Card 3, set handoff to `role: auditor` and run `vitalis-audit`. Verify: all acceptance criteria on three cards; only `src/worker/**`, `migrations/**`, no `src/web/` changes; stock single-writer and centavo invariants; no secret or PII leaks in responses; schema and stock tests on local D1; `pnpm preflight` green.

---

## Checkpoint: Definition of Done & Verification

Before closing VITALIS-2, verify:
- [ ] All 3 task cards completed and verified.
- [ ] Two concurrent reservations for the last unit yield exactly one success, one shortage, and no negative quantity.
- [ ] Confirming a reservation reduces both `reserved` and `on_hand` once; releasing it reduces only `reserved` once.
- [ ] Manual correction without reason is rejected; cannot lower `on_hand` below `reserved`.
- [ ] WhatsApp sale consumes only available units and does not create reservations.
- [ ] Cancelling an unshipped paid order returns units atomically; shipping never changes stock.
- [ ] Order lines and shipping preserve original centavo snapshots.
- [ ] `pnpm preflight` passes completely (Biome format/lint, TypeScript, Vitest).

---

## Implementation log

### READY:impl — Card 1 · Define Drizzle D1 schemas, constraints, indexes, and initial migrations
- role: backend
- tool: opencode
- status: done
- files_changed:
  - `src/worker/db/schema.ts` — nine Drizzle SQLite tables with FKs, `variants_stock_invariants` CHECK, and the planned indexes
  - `src/worker/db/client.ts` — binds the schema to the Drizzle D1 client (`drizzle(d1, { schema })`)
  - `migrations/0000_initial_schema.sql` — generated via `drizzle-kit generate --name initial_schema` (+ `migrations/meta/0000_snapshot.json`, `_journal.json`)
  - `src/worker/db/schema.test.ts` — 14 local-D1 tests: tables, CRUD, integer centavos, defaults, stock CHECK rejections, unique guest token, address snapshot, FKs, indexes
- command: `pnpm vitest run src/worker/db/schema.test.ts && pnpm typecheck`
- result: pass — 14/14 schema tests, typecheck clean
- deviations_from_plan: migration file named `0000_initial_schema.sql` as required (explicit `--name`); drizzle-kit also emitted the standard `migrations/meta/` snapshots; schema test applies the generated SQL via a `?raw` import rather than changing the Vitest config
- next_role: backend

### READY:impl — Card 2 · Implement Stock Service atomic operations (reserve, confirm, release, WhatsApp sale)
- role: backend
- tool: opencode
- status: done
- files_changed:
  - `src/worker/features/stock/types.ts` — `StockReservationItem`, `StockShortageError`, `InvalidStockOperationError` (all `AppError` subclasses)
  - `src/worker/features/stock/service.ts` — `reserveStock`, `confirmReservation`, `releaseReservation`, `recordWhatsAppSale` on `db.batch`
  - `src/worker/features/stock/service.test.ts` — 11 local-D1 tests: multi-line reserve, rollback, shortage detail, available math, confirm, release, WhatsApp sale, concurrent last-unit race
- command: `pnpm vitest run src/worker/features/stock/service.test.ts && pnpm typecheck`
- result: pass — 11/11 stock tests, typecheck clean
- deviations_from_plan: `reserveStock` accepts an optional `deps` (`IdGenerator`/`Clock`) argument with production defaults to keep tests deterministic; the atomic abort uses a conditional `CASE` that writes a negative sentinel into `reserved` so the `variants_stock_invariants` CHECK fails and D1 rolls back the single `db.batch`
- next_role: backend

### READY:impl — Card 3 · Implement Stock Corrections, Order Returns, Invariants, and Price Snapshot Immutability
- role: backend
- tool: opencode
- status: done
- files_changed:
  - `src/worker/features/stock/service.ts` — added `manualStockCorrection` (reason + invariant validation, audit log) and `returnPaidOrderStock`
  - `src/worker/features/stock/audit.test.ts` — 3 tests: blank reason rejected, `newOnHand < reserved` rejected, audit row captures before/after/reason/actor/timestamp
  - `src/worker/features/stock/invariants.test.ts` — 4 tests: cancel returns paid units, shipping is a stock no-op, mid-batch FK failure rolls back, 3-way race never overdraws
  - `src/worker/features/orders/snapshot.test.ts` — 1 test: order line and shipping centavo snapshots survive catalog/settings price changes
- command: `pnpm vitest run src/worker/features/stock/audit.test.ts src/worker/features/stock/invariants.test.ts src/worker/features/orders/snapshot.test.ts && pnpm preflight`
- result: pass — 8/8 new tests, full preflight green (58 files, 46 tests)
- deviations_from_plan: `ManualStockCorrectionParams` typed in `service.ts` (no extra file); the shipping no-op test flips the order status directly because no Orders service/ship route exists yet
- next_role: auditor

### READY:impl — Audit fix · over-applied confirm/release and non-positive quantities
- role: backend
- tool: opencode
- status: done
- files_changed:
  - `src/worker/features/stock/service.ts` — `confirmReservation`/`releaseReservation` now apply in a single `db.batch` whose `UPDATE` is gated by a correlated `EXISTS` on the order's reservation rows, so a second overlapping call matches zero rows after the first batch deletes them; `reserveStock`, `recordWhatsAppSale`, and `returnPaidOrderStock` reject zero/negative/non-integer quantities via `InvalidStockOperationError` before any write
  - `src/worker/features/stock/service.test.ts` — added overlapping double-confirm and double-release tests, zero/negative reserve and WhatsApp quantity tests; the overlap fixtures keep a second hold so the CHECK cannot mask the double-apply
  - `src/worker/features/stock/invariants.test.ts` — added non-positive `returnPaidOrderStock` rejection test
  - `src/worker/db/schema.test.ts` — "every order status" now inserts all six statuses across both sources
  - `src/worker/features/orders/snapshot.test.ts` — fixture order total is consistent (30000 merchandise + 12000 shipping = 42000)
- command: `pnpm vitest run src/worker/features/stock/service.test.ts src/worker/features/stock/invariants.test.ts src/worker/features/stock/audit.test.ts src/worker/features/orders/snapshot.test.ts src/worker/db/schema.test.ts && pnpm preflight`
- result: pass — 38/38 targeted tests, full preflight green (58 files, 51 tests)
- deviations_from_plan: `confirmReservation`/`releaseReservation` moved from a read-then-batch shape to a single correlated-`EXISTS` batch (the audit reject); manual correction keeps its planned read-then-check shape since the reject did not cover it
- next_role: auditor
