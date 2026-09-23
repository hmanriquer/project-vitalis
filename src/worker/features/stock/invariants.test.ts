/// <reference types="vite/client" />
import { env, reset } from 'cloudflare:test';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from '@/worker/db/client';
import { categories, orders, products, reservations, variants } from '@/worker/db/schema';
import {
  confirmReservation,
  reserveStock,
  returnPaidOrderStock,
} from '@/worker/features/stock/service';
import { InvalidStockOperationError, StockShortageError } from '@/worker/features/stock/types';
import migrationSql from '../../../../migrations/0000_initial_schema.sql?raw';

const now = new Date('2026-09-23T12:00:00Z');
const expiresAt = new Date('2026-09-26T12:00:00Z');
const breakpoint = '--> statement-breakpoint';

async function applyMigrations() {
  const statements = migrationSql
    .split(breakpoint)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
  for (const statement of statements) {
    await env.DB.prepare(statement).run();
  }
}

async function seedVariant(db: Db, id: string, onHand: number, reserved = 0) {
  await db.insert(variants).values({
    id,
    productId: 'prod-1',
    name: id,
    priceInCentavos: 10000,
    onHand,
    reserved,
    createdAt: now,
    updatedAt: now,
  });
}

async function ensureOrder(db: Db, id: string) {
  await db.insert(orders).values({
    id,
    source: 'site',
    status: 'pending_payment',
    guestToken: `tok-${id}`,
    customerName: 'Ana Pérez',
    customerPhone: '5512345678',
    customerEmail: 'ana@example.com',
    addressStreet: 'Av. Reforma',
    addressExteriorNumber: '123',
    addressColonia: 'Centro',
    addressCity: 'Ciudad de México',
    addressState: 'CDMX',
    addressPostalCode: '06000',
    shippingFeeInCentavos: 0,
    totalInCentavos: 0,
    createdAt: now,
    updatedAt: now,
  });
}

async function readVariant(db: Db, id: string) {
  const [variant] = await db.select().from(variants).where(eq(variants.id, id));
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

describe('order lifecycle stock invariants', () => {
  it('returns paid units to on hand when cancelling an unshipped order', async () => {
    await seedVariant(db, 'var-a', 3, 0);

    await returnPaidOrderStock(db, [{ variantId: 'var-a', quantity: 2 }]);

    const variant = await readVariant(db, 'var-a');
    expect(variant?.onHand).toBe(5);
    expect(variant?.reserved).toBe(0);
  });

  it('rejects a non-positive return quantity', async () => {
    await seedVariant(db, 'var-a', 3, 0);

    await expect(
      returnPaidOrderStock(db, [{ variantId: 'var-a', quantity: 0 }]),
    ).rejects.toBeInstanceOf(InvalidStockOperationError);
    await expect(
      returnPaidOrderStock(db, [{ variantId: 'var-a', quantity: -2 }]),
    ).rejects.toBeInstanceOf(InvalidStockOperationError);

    expect((await readVariant(db, 'var-a'))?.onHand).toBe(3);
  });

  it('leaves stock counters untouched when an order ships', async () => {
    await seedVariant(db, 'var-a', 5);
    await ensureOrder(db, 'order-ship');
    await reserveStock(db, [{ variantId: 'var-a', quantity: 2 }], 'order-ship', expiresAt);
    await confirmReservation(db, 'order-ship');

    const before = await readVariant(db, 'var-a');
    await db
      .update(orders)
      .set({ status: 'shipped', carrier: 'Estafeta', trackingNumber: 'TRACK-1' })
      .where(eq(orders.id, 'order-ship'));
    const after = await readVariant(db, 'var-a');

    expect(after?.onHand).toBe(before?.onHand);
    expect(after?.reserved).toBe(before?.reserved);
    expect(after?.onHand).toBe(3);
    expect(after?.reserved).toBe(0);
  });

  it('rolls back every line when a database write fails mid-batch', async () => {
    await seedVariant(db, 'var-a', 5);
    await ensureOrder(db, 'order-fail');

    await expect(
      reserveStock(
        db,
        [
          { variantId: 'var-a', quantity: 1 },
          { variantId: 'var-missing', quantity: 1 },
        ],
        'order-fail',
        expiresAt,
      ),
    ).rejects.toThrow();

    expect((await readVariant(db, 'var-a'))?.reserved).toBe(0);
    expect(await db.select().from(reservations)).toHaveLength(0);
  });

  it('never lets concurrent reservations overdraw available units', async () => {
    await seedVariant(db, 'var-a', 2);
    await Promise.all(['order-a', 'order-b', 'order-c'].map((id) => ensureOrder(db, id)));

    const results = await Promise.allSettled(
      ['order-a', 'order-b', 'order-c'].map((orderId) =>
        reserveStock(db, [{ variantId: 'var-a', quantity: 1 }], orderId, expiresAt),
      ),
    );

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(2);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(StockShortageError);

    const variant = await readVariant(db, 'var-a');
    expect(variant?.onHand).toBe(2);
    expect(variant?.reserved).toBe(2);
    expect(await db.select().from(reservations)).toHaveLength(2);
  });
});
