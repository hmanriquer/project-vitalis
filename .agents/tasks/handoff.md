# Handoff — VITALIS-2: Model D1 data and enforce transactional stock invariants

## Goal
Audit closed. Cards 1–3 and the audit fix in [.agents/plans/plan-VITALIS-2.md](.agents/plans/plan-VITALIS-2.md) are accepted.

## State of play
- Done: Drizzle D1 schema and migration, stock reserve/confirm/release/WhatsApp sale, manual correction, paid-order return, and centavo snapshot columns. Confirm and release apply in one `db.batch` gated by the reservation rows. Non-positive quantities are rejected before any write.
- In flight: None.
- Blocked: None.

## Open decisions
None.

## Role and tool
- role: auditor
- tool: opencode

## Verdict
- verdict: merge
- next_role: none
- reject_owner: none

## Summary
Re-audit passed. Overlapping confirm and release move counters once, including when another hold is present. `pnpm preflight` passed (51 tests). Report: [.agents/tasks/audit.md](.agents/tasks/audit.md).

## Artifacts
- `.agents/tasks/audit.md`
- `.agents/plans/plan-VITALIS-2.md`
- Branch: `feat/vitalis-2-stock-model`
