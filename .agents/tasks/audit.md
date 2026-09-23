# Audit — VITALIS-2

**Issue:** VITALIS-2  
**Plan:** `.agents/plans/plan-VITALIS-2.md`  
**Scope reviewed:** Re-audit of the working tree on `feat/vitalis-2-stock-model` after the audit fix. Schema, migration, stock service, and local-D1 tests. No `src/web/` diff.

## Axes

### 1. Correctness vs acceptance

The previous reject is closed. `confirmReservation` and `releaseReservation` each run one `db.batch`: the counter update is gated by `EXISTS` on that order’s reservation rows, and the same batch deletes those rows. A second overlapping call matches nothing after the first delete, so counters move once even when another hold would have kept `variants_stock_invariants` from firing. Overlap tests keep a second reservation (quantity 4) and expect it to survive.

`reserveStock`, `recordWhatsAppSale`, and `returnPaidOrderStock` reject a non-positive or non-integer quantity with `InvalidStockOperationError` before any write.

Schema, centavo columns, stock CHECK, indexes, reserve, WhatsApp sale, manual correction, audit log, and the price snapshot still match cards 1–3.

### 2. Boundaries and lane

Diff stays in `src/worker/**` and `migrations/**`. No routes, so no SQL in routes. Quantity writes go through `src/worker/features/stock/service.ts` only. The audit fix touched that service and four test files. `components/ui` is untouched. The browser does not call vendors.

### 3. Security and data exposure

No new route returns `guest_token`, `payment_reference`, buyer email, phone, or address. New failures stay on `AppError` with snake_case codes and Spanish messages. Shortage and invalid-quantity `details` are variant id and counts. No secrets in the new code.

### 4. Tests

`pnpm preflight` is green: 12 files, 51 tests, typecheck clean. Stock and schema tests use the `worker` pool against local D1. Overlap coverage is `Promise.all` of two confirms and two releases on the same order, with a second hold so a double subtract would still satisfy the CHECK. Zero and negative quantities are rejected for reserve, WhatsApp sale, and paid return. All six order statuses are inserted. The snapshot fixture is 30000 merchandise + 12000 shipping = 42000.

There is still no git history of a fail-first cycle; the work is uncommitted. The overlap tests fail on the previous read-then-subtract shape, and they pass on this one.

### 5. Simplicity and performance

Confirm and release are one indexed batch each (`idx_reservations_order`). Reserve and WhatsApp sale stay a single batch that aborts through the stock CHECK. `applyMigrations` is still copied across the D1 test files. `recordWhatsAppSale` still accepts an unused `orderId`.

`manualStockCorrection` still reads `reserved` outside its batch. A concurrent reserve can make the write fail the CHECK and surface a raw database error. The row does not land below `reserved`. That was not part of the reject, and the acceptance check for a correction below reserved is covered.

No React or page-load surface in this diff, so `vercel-react-best-practices` and `web-perf` do not apply. No auth code, so `better-auth-security-best-practices` does not apply.

## Domain invariants

Money columns are integers in centavos. The sellable unit is the variant. The row CHECK encodes `on_hand >= 0`, `reserved >= 0`, and `on_hand >= reserved`. Order lines store the sale price separately from the catalog price, and the snapshot test shows those stored centavos survive a catalog edit. New user-facing errors are Spanish. No UI, so Tabler and `DESIGN.md` are out of scope. `source` and `status` are Drizzle text enums; the migration has no SQL CHECK on them.

`returnPaidOrderStock` still adds `on_hand` on every call. The orders path that cancels a paid order has to invoke it once. The ship test still flips `orders.status` directly, which matches the logged deviation that no ship service exists yet.

## Preflight

- command: `pnpm preflight`
- result: pass — Biome check and lint clean (58 files), `tsc -b` clean, Vitest 51/51 passed. Playwright printed an unsupported-OS warning while installing Chromium; the test run still completed.

## Verdict

**verdict:** merge  
**reject_owner:** none  
**notes:** Confirm and release apply once under overlap, and stock writes reject a non-positive quantity. Ready to commit on `feat/vitalis-2-stock-model`.
