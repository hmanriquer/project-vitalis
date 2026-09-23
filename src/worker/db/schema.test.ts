/// <reference types="vite/client" />
import { env, reset } from 'cloudflare:test';
import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from '@/worker/db/client';
import {
  categories,
  orderLines,
  orders,
  productPhotos,
  products,
  reservations,
  stockAuditLogs,
  storeSettings,
  variants,
} from '@/worker/db/schema';
import migrationSql from '../../../migrations/0000_initial_schema.sql?raw';

const now = new Date('2026-09-23T12:00:00Z');
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

async function seedCategory(db: Db) {
  await db.insert(categories).values({
    id: 'cat-1',
    name: 'Medicina natural',
    slug: 'medicina-natural',
    createdAt: now,
    updatedAt: now,
  });
}

async function seedProduct(db: Db) {
  await db.insert(products).values({
    id: 'prod-1',
    name: 'Jabón de hierbas',
    slug: 'jabon-de-hierbas',
    description: 'Jabón artesanal',
    categoryId: 'cat-1',
    createdAt: now,
    updatedAt: now,
  });
}

async function seedVariant(db: Db, values: Partial<typeof variants.$inferInsert> & { id: string }) {
  await db.insert(variants).values({
    productId: 'prod-1',
    name: 'Presentación default',
    priceInCentavos: 15000,
    createdAt: now,
    updatedAt: now,
    ...values,
  });
}

async function seedOrder(db: Db, values: Partial<typeof orders.$inferInsert> & { id: string }) {
  await db.insert(orders).values({
    source: 'site',
    status: 'pending_payment',
    guestToken: `tok-${values.id}`,
    customerName: 'Ana Pérez',
    customerPhone: '5512345678',
    customerEmail: 'ana@example.com',
    addressStreet: 'Av. Reforma',
    addressExteriorNumber: '123',
    addressColonia: 'Centro',
    addressCity: 'Ciudad de México',
    addressState: 'CDMX',
    addressPostalCode: '06000',
    shippingFeeInCentavos: 12000,
    totalInCentavos: 27000,
    createdAt: now,
    updatedAt: now,
    ...values,
  });
}

let db: Db;

beforeEach(async () => {
  await applyMigrations();
  db = createDb(env.DB);
});

afterEach(async () => {
  await reset();
});

describe('schema tables', () => {
  it('creates every domain table', async () => {
    const rows = await db.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'table' order by name`,
    );
    const names = rows.map((row) => row.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'categories',
        'order_lines',
        'orders',
        'product_photos',
        'products',
        'reservations',
        'stock_audit_logs',
        'store_settings',
        'variants',
      ]),
    );
  });

  it('round-trips a product catalog through Drizzle', async () => {
    await seedCategory(db);
    await seedProduct(db);
    await db.insert(productPhotos).values({
      id: 'photo-1',
      productId: 'prod-1',
      url: 'https://photos.example.com/photo-1.jpg',
      alt: 'Jabón',
      sortOrder: 1,
      createdAt: now,
    });
    await seedVariant(db, { id: 'var-1', onHand: 10, reserved: 2 });

    const [photo] = await db.select().from(productPhotos);
    const [product] = await db.select().from(products);
    const [variant] = await db.select().from(variants);

    expect(photo?.url).toBe('https://photos.example.com/photo-1.jpg');
    expect(product?.categoryId).toBe('cat-1');
    expect(variant?.onHand).toBe(10);
    expect(variant?.reserved).toBe(2);
  });

  it('declares centavo money columns as integers', async () => {
    const columns = await db.all<{ name: string; type: string }>(
      sql`select name, type from pragma_table_info('variants')`,
    );
    const priceColumn = columns.find((column) => column.name === 'price_in_centavos');
    expect(priceColumn?.type).toBe('INTEGER');

    await seedCategory(db);
    await seedProduct(db);
    await seedVariant(db, { id: 'var-money', priceInCentavos: 19999 });

    const row = await db.get<{ kind: string }>(
      sql`select typeof(price_in_centavos) as kind from variants where id = 'var-money'`,
    );
    expect(row?.kind).toBe('integer');
  });

  it('applies default values for store settings and booleans', async () => {
    await db.insert(storeSettings).values({ updatedAt: now });
    const [settings] = await db.select().from(storeSettings);
    expect(settings?.id).toBe('default');
    expect(settings?.shippingFeeInCentavos).toBe(0);
    expect(settings?.whatsappPhoneNumber).toBe('');

    await seedCategory(db);
    await seedProduct(db);
    const [product] = await db.select().from(products);
    expect(product?.isActive).toBe(true);
  });
});

describe('variant stock invariants', () => {
  beforeEach(async () => {
    await seedCategory(db);
    await seedProduct(db);
  });

  it('rejects a negative on_hand', async () => {
    await expect(seedVariant(db, { id: 'var-neg', onHand: -1 })).rejects.toThrow();
  });

  it('rejects a negative reserved', async () => {
    await expect(
      seedVariant(db, { id: 'var-neg-reserved', onHand: 5, reserved: -1 }),
    ).rejects.toThrow();
  });

  it('rejects on_hand lower than reserved', async () => {
    await expect(seedVariant(db, { id: 'var-short', onHand: 1, reserved: 2 })).rejects.toThrow();
  });

  it('accepts on_hand equal to reserved', async () => {
    await seedVariant(db, { id: 'var-equal', onHand: 3, reserved: 3 });
    const [variant] = await db.select().from(variants);
    expect(variant?.onHand).toBe(3);
    expect(variant?.reserved).toBe(3);
  });
});

describe('orders constraints', () => {
  beforeEach(async () => {
    await seedCategory(db);
    await seedProduct(db);
  });

  it('accepts site and whatsapp sources with every order status', async () => {
    const statuses = [
      'pending_payment',
      'paid',
      'shipped',
      'cancelled',
      'expired',
      'needs_review',
    ] as const;

    for (const [index, status] of statuses.entries()) {
      await seedOrder(db, {
        id: `order-${status}`,
        source: index % 2 === 0 ? 'site' : 'whatsapp',
        status,
      });
    }

    const rows = await db.select().from(orders).orderBy(orders.id);
    expect(rows.map((row) => row.status)).toEqual([...statuses].sort());
    expect(rows.map((row) => row.source)).toContain('site');
    expect(rows.map((row) => row.source)).toContain('whatsapp');
    expect(rows).toHaveLength(statuses.length);
  });

  it('enforces a unique guest token', async () => {
    await seedOrder(db, { id: 'order-a', guestToken: 'same-token' });
    await expect(seedOrder(db, { id: 'order-b', guestToken: 'same-token' })).rejects.toThrow();
  });

  it('stores the Mexican address snapshot and integer centavos', async () => {
    await seedOrder(db, { id: 'order-address' });
    const [order] = await db.select().from(orders);
    expect(order?.addressStreet).toBe('Av. Reforma');
    expect(order?.addressExteriorNumber).toBe('123');
    expect(order?.addressColonia).toBe('Centro');
    expect(order?.addressCity).toBe('Ciudad de México');
    expect(order?.addressState).toBe('CDMX');
    expect(order?.addressPostalCode).toBe('06000');
    expect(order?.shippingFeeInCentavos).toBe(12000);
    expect(order?.totalInCentavos).toBe(27000);
  });

  it('stores order lines and reservations with centavo unit prices', async () => {
    await seedVariant(db, { id: 'var-line', onHand: 5 });
    await seedOrder(db, { id: 'order-lines' });
    await db.insert(orderLines).values({
      id: 'line-1',
      orderId: 'order-lines',
      variantId: 'var-line',
      quantity: 2,
      unitPriceInCentavos: 15000,
      totalInCentavos: 30000,
      createdAt: now,
    });
    await db.insert(reservations).values({
      id: 'res-1',
      orderId: 'order-lines',
      variantId: 'var-line',
      quantity: 2,
      expiresAt: new Date('2026-09-26T12:00:00Z'),
      createdAt: now,
    });
    await db.insert(stockAuditLogs).values({
      id: 'audit-1',
      variantId: 'var-line',
      previousOnHand: 5,
      newOnHand: 7,
      reason: 'Recepción de proveedor',
      actorId: 'admin-1',
      createdAt: now,
    });

    const [line] = await db.select().from(orderLines);
    const [reservation] = await db.select().from(reservations);
    const [audit] = await db.select().from(stockAuditLogs);
    expect(line?.unitPriceInCentavos).toBe(15000);
    expect(line?.totalInCentavos).toBe(30000);
    expect(reservation?.quantity).toBe(2);
    expect(audit?.reason).toBe('Recepción de proveedor');
  });

  it('relates variants and lines to their parents with foreign keys', async () => {
    const variantFks = await db.all<{ table: string }>(
      sql`select "table" from pragma_foreign_key_list('variants')`,
    );
    const lineFks = await db.all<{ table: string }>(
      sql`select "table" from pragma_foreign_key_list('order_lines')`,
    );
    const reservationFks = await db.all<{ table: string }>(
      sql`select "table" from pragma_foreign_key_list('reservations')`,
    );

    expect(variantFks.map((fk) => fk.table)).toContain('products');
    expect(lineFks.map((fk) => fk.table)).toEqual(expect.arrayContaining(['orders', 'variants']));
    expect(reservationFks.map((fk) => fk.table)).toEqual(
      expect.arrayContaining(['orders', 'variants']),
    );
  });

  it('declares the required indexes', async () => {
    const rows = await db.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'index'`,
    );
    const names = rows.map((row) => row.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'idx_orders_status',
        'idx_orders_paid_at',
        'idx_orders_email',
        'idx_orders_guest_token',
        'idx_reservations_expires_at',
        'idx_reservations_order',
        'idx_variants_product',
        'idx_variants_stock',
      ]),
    );
  });
});
