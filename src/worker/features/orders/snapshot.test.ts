/// <reference types="vite/client" />
import { env, reset } from 'cloudflare:test';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from '@/worker/db/client';
import {
  categories,
  orderLines,
  orders,
  products,
  storeSettings,
  variants,
} from '@/worker/db/schema';
import migrationSql from '../../../../migrations/0000_initial_schema.sql?raw';

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
  await db.insert(variants).values({
    id: 'var-a',
    productId: 'prod-1',
    name: 'Presentación default',
    priceInCentavos: 15000,
    onHand: 10,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(storeSettings).values({
    id: 'default',
    shippingFeeInCentavos: 12000,
    whatsappPhoneNumber: '5215512345678',
    updatedAt: now,
  });
  await db.insert(orders).values({
    id: 'order-1',
    source: 'site',
    status: 'pending_payment',
    guestToken: 'tok-order-1',
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
    totalInCentavos: 42000,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(orderLines).values({
    id: 'line-1',
    orderId: 'order-1',
    variantId: 'var-a',
    quantity: 2,
    unitPriceInCentavos: 15000,
    totalInCentavos: 30000,
    createdAt: now,
  });
});

afterEach(async () => {
  await reset();
});

describe('order snapshot immutability', () => {
  it('keeps the agreed line prices and shipping fee when the catalog changes', async () => {
    await db
      .update(variants)
      .set({ priceInCentavos: 20000, updatedAt: now })
      .where(eq(variants.id, 'var-a'));
    await db
      .update(storeSettings)
      .set({ shippingFeeInCentavos: 20000, updatedAt: now })
      .where(eq(storeSettings.id, 'default'));

    const [order] = await db.select().from(orders).where(eq(orders.id, 'order-1'));
    const [line] = await db.select().from(orderLines).where(eq(orderLines.id, 'line-1'));
    const [variant] = await db.select().from(variants).where(eq(variants.id, 'var-a'));
    const [settings] = await db.select().from(storeSettings).where(eq(storeSettings.id, 'default'));

    expect(order?.shippingFeeInCentavos).toBe(12000);
    expect(order?.totalInCentavos).toBe(42000);
    expect(line?.unitPriceInCentavos).toBe(15000);
    expect(line?.totalInCentavos).toBe(30000);

    expect(variant?.priceInCentavos).toBe(20000);
    expect(settings?.shippingFeeInCentavos).toBe(20000);
  });
});
