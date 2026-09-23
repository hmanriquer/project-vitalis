/// <reference types="vite/client" />
import { env, reset } from 'cloudflare:test';
import { asc, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from '@/worker/db/client';
import { categories, products, stockAuditLogs, variants } from '@/worker/db/schema';
import { manualStockCorrection } from '@/worker/features/stock/service';
import { createFakeClock, createSequentialIdGenerator } from '@/worker/services';
import migrationSql from '../../../../migrations/0000_initial_schema.sql?raw';

const now = new Date('2026-09-23T12:00:00Z');
const breakpoint = '--> statement-breakpoint';
const deps = {
  ids: createSequentialIdGenerator('audit'),
  clock: createFakeClock(now),
};

async function applyMigrations() {
  const statements = migrationSql
    .split(breakpoint)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
  for (const statement of statements) {
    await env.DB.prepare(statement).run();
  }
}

async function seedVariant(db: Db, onHand: number, reserved = 0) {
  await db.insert(variants).values({
    id: 'var-a',
    productId: 'prod-1',
    name: 'Presentación default',
    priceInCentavos: 10000,
    onHand,
    reserved,
    createdAt: now,
    updatedAt: now,
  });
}

async function readVariant(db: Db) {
  const [variant] = await db.select().from(variants).where(eq(variants.id, 'var-a'));
  return variant;
}

let db: Db;

beforeEach(async () => {
  await applyMigrations();
  db = createDb(env.DB);
  await db.insert(categories).values({
    id: 'cat-1',
    name: 'Medicina natural',
    slug: 'medicina-natural',
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(products).values({
    id: 'prod-1',
    name: 'Jabón de hierbas',
    slug: 'jabon-de-hierbas',
    description: 'Jabón artesanal',
    categoryId: 'cat-1',
    createdAt: now,
    updatedAt: now,
  });
});

afterEach(async () => {
  await reset();
});

describe('manualStockCorrection', () => {
  it('rejects a blank reason', async () => {
    await seedVariant(db, 5);

    await expect(
      manualStockCorrection(db, { variantId: 'var-a', newOnHand: 8, reason: '   ' }, deps),
    ).rejects.toMatchObject({ code: 'invalid_argument' });

    expect((await readVariant(db))?.onHand).toBe(5);
    expect(await db.select().from(stockAuditLogs)).toHaveLength(0);
  });

  it('rejects a correction below the reserved units', async () => {
    await seedVariant(db, 5, 3);

    await expect(
      manualStockCorrection(db, { variantId: 'var-a', newOnHand: 2, reason: 'Conteo' }, deps),
    ).rejects.toMatchObject({ code: 'invalid_stock_invariant' });

    expect((await readVariant(db))?.onHand).toBe(5);
    expect(await db.select().from(stockAuditLogs)).toHaveLength(0);
  });

  it('records the previous and new counts, reason, actor, and timestamp', async () => {
    await seedVariant(db, 5, 3);

    await manualStockCorrection(
      db,
      { variantId: 'var-a', newOnHand: 9, reason: 'Recepción de proveedor', actorId: 'admin-1' },
      deps,
    );

    expect((await readVariant(db))?.onHand).toBe(9);

    const [log] = await db.select().from(stockAuditLogs).orderBy(asc(stockAuditLogs.createdAt));
    expect(log?.variantId).toBe('var-a');
    expect(log?.previousOnHand).toBe(5);
    expect(log?.newOnHand).toBe(9);
    expect(log?.reason).toBe('Recepción de proveedor');
    expect(log?.actorId).toBe('admin-1');
    expect(log?.createdAt?.toISOString()).toBe(now.toISOString());
  });
});
