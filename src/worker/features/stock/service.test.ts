/// <reference types="vite/client" />
import { env, reset } from 'cloudflare:test';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from '@/worker/db/client';
import { categories, orders, products, reservations, variants } from '@/worker/db/schema';
import {
  confirmReservation,
  recordWhatsAppSale,
  releaseReservation,
  reserveStock,
} from '@/worker/features/stock/service';
import {
  InvalidStockOperationError,
  type StockReservationItem,
  StockShortageError,
} from '@/worker/features/stock/types';
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

async function reserve(
  db: Db,
  items: StockReservationItem[],
  orderId: string,
  expires = expiresAt,
) {
  await ensureOrder(db, orderId);
  return reserveStock(db, items, orderId, expires);
}

async function readVariant(db: Db, id: string) {
  const [variant] = await db.select().from(variants).where(eq(variants.id, id));
  return variant;
}

async function readReservations(db: Db) {
  return db.select().from(reservations);
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

describe('reserveStock', () => {
  it('reserves every line and records reservation rows', async () => {
    await seedVariant(db, 'var-a', 5);
    await seedVariant(db, 'var-b', 2);

    await reserve(
      db,
      [
        { variantId: 'var-a', quantity: 2 },
        { variantId: 'var-b', quantity: 1 },
      ],
      'order-1',
    );

    expect((await readVariant(db, 'var-a'))?.reserved).toBe(2);
    expect((await readVariant(db, 'var-b'))?.reserved).toBe(1);

    const rows = await readReservations(db);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.orderId)).toEqual(['order-1', 'order-1']);
    expect(rows.map((row) => row.quantity).sort()).toEqual([1, 2]);
  });

  it('rolls back the whole batch when one line is short', async () => {
    await seedVariant(db, 'var-a', 5);
    await seedVariant(db, 'var-b', 1);

    await expect(
      reserve(
        db,
        [
          { variantId: 'var-a', quantity: 2 },
          { variantId: 'var-b', quantity: 5 },
        ],
        'order-short',
      ),
    ).rejects.toBeInstanceOf(StockShortageError);

    expect((await readVariant(db, 'var-a'))?.reserved).toBe(0);
    expect((await readVariant(db, 'var-b'))?.reserved).toBe(0);
    expect(await readReservations(db)).toHaveLength(0);
  });

  it('names the short variant and the available units', async () => {
    await seedVariant(db, 'var-a', 1);

    const error = await reserve(db, [{ variantId: 'var-a', quantity: 3 }], 'order-name').catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(StockShortageError);
    expect(error).toMatchObject({ variantId: 'var-a', requested: 3, available: 1 });
  });

  it('counts available as on hand minus reserved', async () => {
    await seedVariant(db, 'var-a', 3, 2);

    await expect(
      reserve(db, [{ variantId: 'var-a', quantity: 2 }], 'order-avail'),
    ).rejects.toBeInstanceOf(StockShortageError);
    await reserve(db, [{ variantId: 'var-a', quantity: 1 }], 'order-avail-ok');
    expect((await readVariant(db, 'var-a'))?.reserved).toBe(3);
  });
});

describe('confirmReservation', () => {
  it('drops reserved and on hand once and clears the reservation rows', async () => {
    await seedVariant(db, 'var-a', 5);
    await reserve(db, [{ variantId: 'var-a', quantity: 2 }], 'order-confirm');

    await confirmReservation(db, 'order-confirm');

    const variant = await readVariant(db, 'var-a');
    expect(variant?.onHand).toBe(3);
    expect(variant?.reserved).toBe(0);
    expect(await readReservations(db)).toHaveLength(0);
  });

  it('is idempotent when the reservation no longer exists', async () => {
    await seedVariant(db, 'var-a', 5);

    await confirmReservation(db, 'order-missing');

    const variant = await readVariant(db, 'var-a');
    expect(variant?.onHand).toBe(5);
    expect(variant?.reserved).toBe(0);
  });

  it('applies once when two confirms overlap', async () => {
    await seedVariant(db, 'var-a', 10);
    await reserve(db, [{ variantId: 'var-a', quantity: 2 }], 'order-1');
    await reserve(db, [{ variantId: 'var-a', quantity: 4 }], 'order-2');

    await Promise.all([confirmReservation(db, 'order-1'), confirmReservation(db, 'order-1')]);

    const variant = await readVariant(db, 'var-a');
    expect(variant?.onHand).toBe(8);
    expect(variant?.reserved).toBe(4);
    const rows = await readReservations(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.orderId).toBe('order-2');
  });
});

describe('releaseReservation', () => {
  it('drops reserved only and leaves on hand untouched', async () => {
    await seedVariant(db, 'var-a', 5);
    await reserve(db, [{ variantId: 'var-a', quantity: 2 }], 'order-release');

    await releaseReservation(db, 'order-release');

    const variant = await readVariant(db, 'var-a');
    expect(variant?.onHand).toBe(5);
    expect(variant?.reserved).toBe(0);
    expect(await readReservations(db)).toHaveLength(0);
  });

  it('is idempotent when the reservation no longer exists', async () => {
    await seedVariant(db, 'var-a', 5);

    await releaseReservation(db, 'order-missing');

    expect((await readVariant(db, 'var-a'))?.reserved).toBe(0);
  });

  it('applies once when two releases overlap', async () => {
    await seedVariant(db, 'var-a', 10);
    await reserve(db, [{ variantId: 'var-a', quantity: 2 }], 'order-1');
    await reserve(db, [{ variantId: 'var-a', quantity: 4 }], 'order-2');

    await Promise.all([releaseReservation(db, 'order-1'), releaseReservation(db, 'order-1')]);

    const variant = await readVariant(db, 'var-a');
    expect(variant?.onHand).toBe(10);
    expect(variant?.reserved).toBe(4);
    const rows = await readReservations(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.orderId).toBe('order-2');
  });
});

describe('recordWhatsAppSale', () => {
  it('decrements on hand directly without touching reserved or reservations', async () => {
    await seedVariant(db, 'var-a', 5, 1);

    await recordWhatsAppSale(db, [{ variantId: 'var-a', quantity: 2 }], 'order-wa');

    const variant = await readVariant(db, 'var-a');
    expect(variant?.onHand).toBe(3);
    expect(variant?.reserved).toBe(1);
    expect(await readReservations(db)).toHaveLength(0);
  });

  it('rejects a short sale without mutating any quantity', async () => {
    await seedVariant(db, 'var-a', 2, 1);

    await expect(
      recordWhatsAppSale(db, [{ variantId: 'var-a', quantity: 2 }], 'order-wa'),
    ).rejects.toBeInstanceOf(StockShortageError);

    const variant = await readVariant(db, 'var-a');
    expect(variant?.onHand).toBe(2);
    expect(variant?.reserved).toBe(1);
    expect(await readReservations(db)).toHaveLength(0);
  });
});

describe('quantity validation', () => {
  it('rejects zero and negative reserve quantities without mutating stock', async () => {
    await seedVariant(db, 'var-a', 5);

    await expect(
      reserveStock(db, [{ variantId: 'var-a', quantity: 0 }], 'order-zero', expiresAt),
    ).rejects.toBeInstanceOf(InvalidStockOperationError);
    await expect(
      reserveStock(db, [{ variantId: 'var-a', quantity: -1 }], 'order-negative', expiresAt),
    ).rejects.toBeInstanceOf(InvalidStockOperationError);

    expect((await readVariant(db, 'var-a'))?.reserved).toBe(0);
    expect(await readReservations(db)).toHaveLength(0);
  });

  it('rejects a non-positive WhatsApp sale quantity', async () => {
    await seedVariant(db, 'var-a', 5);

    await expect(
      recordWhatsAppSale(db, [{ variantId: 'var-a', quantity: 0 }]),
    ).rejects.toBeInstanceOf(InvalidStockOperationError);
    await expect(
      recordWhatsAppSale(db, [{ variantId: 'var-a', quantity: -2 }]),
    ).rejects.toBeInstanceOf(InvalidStockOperationError);

    expect((await readVariant(db, 'var-a'))?.onHand).toBe(5);
  });
});

describe('concurrency', () => {
  it('lets exactly one of two checkouts win the last available unit', async () => {
    await seedVariant(db, 'var-a', 1);
    await ensureOrder(db, 'order-x');
    await ensureOrder(db, 'order-y');

    const results = await Promise.allSettled([
      reserveStock(db, [{ variantId: 'var-a', quantity: 1 }], 'order-x', expiresAt),
      reserveStock(db, [{ variantId: 'var-a', quantity: 1 }], 'order-y', expiresAt),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(StockShortageError);

    const variant = await readVariant(db, 'var-a');
    expect(variant?.onHand).toBe(1);
    expect(variant?.reserved).toBe(1);
    expect(await readReservations(db)).toHaveLength(1);
  });
});
